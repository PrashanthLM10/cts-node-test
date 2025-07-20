const express = require("express");
const {
  S3Client,
  S3ServiceException,
  paginateListObjectsV2,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  RenameObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { encryptString, decryptString } = require("./key-decryption");
//const streamifier = require("streamifier");

// setup router
const router = new express.Router();

router.get("/files/", (req, res) => {
  res.send("Working!!!");
});

// variable to store aws params
let aws_params = {};

//variable for s3Client
let s3Client = null;

//variable to setup multer
let upload = null;

// setup s3 client

// getting access keys tore in Parameter store in AWS
// https://ap-south-1.console.aws.amazon.com/systems-manager/parameters/?region=ap-south-1&tab=Table
// The above was for when deployed in AWS EC2

const accessKey = decryptString(process.env.S3_PERSONAL_ACCESS_KEY);
const secretAccessKey = decryptString(
  process.env.S3_PERSONAL_SECRET_ACCESS_KEY
);

const getAccessKeys = async () => {
  return {
    S3_ACCESS_KEY: accessKey,
    S3_SECRET_ACCESS_KEY: secretAccessKey,
  };
};

// Using the fetched params to configure S3Client
const setupS3Client = () => {
  s3Client = new S3Client({
    region: process.env.AWS_S3_PERSONAL_REGION,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,
    },
  });
};

//setup multer for S3
const setupMulter = () => {
  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(
          null,
          `${process.env.AWS_S3_PERSONAL_FILES_FOLDER}/${file.originalname}`
        );
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * Number(process.env.MAX_FILE_SIZE), // Max file size in MB
    },
  });
};

// add routes
const setupFilesRoutes = () => {
  // test route - getaccesskeyparam
  /* router.get("/get-access-key-param", async (req, res) => {
    res.send(aws_params);
  }); */

  //get max allowed file size
  router.get("/files/max-file-size", (req, res) => {
    res.send(process.env.MAX_FILE_SIZE || null);
  });

  // upload files to s3
  router.post(
    "/files/upload-file",
    upload.array("file", 5),
    async (req, res) => {
      // multer is setup with sulter-s3 as middelware which takes care of the uploading in its function call. Nothing to do here
      // This function is only called on success,
      // Error is called through an error middleware we  setup below

      res.send(`Successfully uploaded ${req.files.length} files`);
    }
  );

  // get a presigned url for each file to download
  const getSignedURLForObject = async (client, key) => {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
        Key: key,
      });
      // URL expires in 1 hour.
      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      return url;
    } catch (e) {
      if (e instanceof Error && e.name === "CredentialsProviderError") {
        console.error(
          `There was an error getting your credentials. Are your local credentials configured?\n${e.name}: ${e.message}`
        );
      } else {
        throw e;
      }
    }
  };

  router.get("/files/get-all-files", async (req, res) => {
    //paginator config
    const paginatorConfig = {
      client: s3Client,
      pageSize: 50,
    };

    // bucket config
    const params = {
      Bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
      prefix: process.env.AWS_S3_PERSONAL_FILES_FOLDER,
    };

    const objects = [];
    try {
      const paginatorData = paginateListObjectsV2(paginatorConfig, params);
      for await (const page of paginatorData) {
        objects.push(page.Contents);
      }

      //
      const files = objects.find((bucket) =>
        bucket[0].Key.includes(process.env.AWS_S3_PERSONAL_FILES_FOLDER)
      );

      // add a presigned url to download which expires in 1 hour

      for await (const file of files) {
        file.URL = await getSignedURLForObject(s3Client, file.Key);
        file.Name = file.Key.split("/")[1];
      }

      res.send(files);
    } catch (e) {
      if (e instanceof S3ServiceException && e.name === "NoSuchBucket") {
        console.error(
          `Error from S3 while listing objects for "${process.env.AWS_S3_PERSONAL_BUCKETNAME}". The bucket doesn't exist.`
        );
      } else if (e instanceof S3ServiceException) {
        console.error(
          `Error from S3 while listing objects for "${process.env.AWS_S3_PERSONAL_BUCKETNAME}".  ${e.name}: ${e.message}`
        );
      } else {
        throw e;
      }
    }
  });

  // delete a file from s3
  router.delete("/files/delete-file/:fileName", async (req, res) => {
    const fileName = req.params.fileName;
    if (!fileName) {
      return res.status(400).send("File name is required");
    }

    const deleteParams = {
      Bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
      Key: `${process.env.AWS_S3_PERSONAL_FILES_FOLDER}/${fileName}`,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);

    try {
      const response = await s3Client.send(deleteCommand);
      res.send(response);
    } catch (e) {
      if (e instanceof S3ServiceException && e.name === "NoSuchKey") {
        return res.status(404).send("File not found");
      } else {
        console.error(`Error deleting file: ${e.name}: ${e.message}`);
        return res.status(500).send("Error deleting file");
      }
    }
  });

  /**
   * @request body
   * {
   *  oldName: "oldFileName.txt",
   * newName: "newFileName.txt"
   * }
   */
  //rename a file in s3
  router.post("/files/rename-file", async (req, res) => {
    const { oldName, newName } = req.body;

    // validate request body
    if (!oldName || !newName) {
      return res.status(400).send("Both oldName and newName are required");
    }
    // check if oldName and newName are same
    if (oldName === newName) {
      return res.status(400).send("Old name and new name cannot be the same");
    }

    // get rename command to send to s3
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
      Key: `${process.env.AWS_S3_PERSONAL_FILES_FOLDER}/${newName}`,
      CopySource: `${process.env.AWS_S3_PERSONAL_BUCKETNAME}/${process.env.AWS_S3_PERSONAL_FILES_FOLDER}/${oldName}`,
    });
    try {
      const copyResponse = await s3Client.send(copyCommand);
      if (copyResponse.$metadata.httpStatusCode === 200) {
        const deleteParams = {
          Bucket: process.env.AWS_S3_PERSONAL_BUCKETNAME,
          Key: `${process.env.AWS_S3_PERSONAL_FILES_FOLDER}/${oldName}`,
        };

        const deleteCommand = new DeleteObjectCommand(deleteParams);
        try {
          const deleteResponse = await s3Client.send(deleteCommand);
          if (
            deleteResponse.$metadata.httpStatusCode === 204 ||
            deleteResponse.$metadata.httpStatusCode === 200
          ) {
            res.status(200).send("Rename successful!!");
          }
        } catch (e) {
          throw e;
        }
      } else {
        throw new ResponseError("Error renaming file--");
      }
    } catch (e) {
      console.log(e);
      if (e instanceof S3ServiceException && e.name === "NoSuchKey") {
        return res.status(404).send("File not found");
      } else {
        console.log(`Error renaming file: ${e.name}: ${e.message}`);
        return res.status(500).send("Error renaming file");
      }
    }
  });
};

//setup error middleware which will catch all the errors middlware throws
const errorMiddleWare = (err, req, res, next) => {
  if (err) {
    const resErrObject = {
      code: err.code,
      error: err.message,
      status: "Error Uploading!!!",
    };
    res.status(500).send(resErrObject);
  }
};

// configure app with router and error middleware
const configureRouter = async (app) => {
  await getAccessKeys();
  setupS3Client();
  setupMulter();
  setupFilesRoutes();
  app.use(router);
  app.use(errorMiddleWare);
  return app;
};

module.exports = { configureRouter };

/**
 * CODE FOR FUTURE REFERENCE
 * 
 * DIDN'T WORK
 * 1. Create a stream from buffer (use 'streamifier' if using multer) and then pass the stream to Body, but his needs a HEADER which tells S3 the size of the chunk, which we will have to calculate
 * TRY THIS and SOLVE!!!!!!!!!
 * 
 * const uploadToS3 = async (file) => {
  try {
    const fileStream = streamifier.createReadStream(file.buffer);
    // upload to s3 bucket
    const s3Response = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKETNAME,
        Body: fileStream,
        Key: `${process.env.AWS_S3_FILES_FOLDER}/${file.originalname}`,
      })
    );
    console.log(s3Response);
    } catch (e) {
      console.error(e);
    }
  };

  
 *
 * WORKED!!!
 * 2. Use memoryStorage() in multer and send the buffer object to S3 through 'Body' key in params,
 * but since it is using memory I think it will cost us more to upload, we need to stream the data,
 * this uses buffer object
 * 
 * try {
    const file = req.file;
    const { originalname, buffer, mimetype, size } = file;
    // upload to s3 bucket
     const s3Response = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKETNAME,
        Body: buffer,
        Key: `${process.env.AWS_S3_FILES_FOLDER}/${originalname}`,
      })
    );
    console.log(s3Response);
    res.status(200).send(s3Response);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error uploading file");
  }


  // Renam file using RenamCommandObject
  DIDN'T WORK, because it only applied for OneZone Storage class
  // got back a response saying 'Not Implemented'
  try {
      const renameCommand = new RenameObjectCommand({
        Bucket: process.env.AWS_S3_BUCKETNAME,
        Key: `${process.env.AWS_S3_FILES_FOLDER}/${newName}`,
        RenameSource: `${process.env.AWS_S3_FILES_FOLDER}/${oldName}`,
      });
      const response = await s3Client.send(renameCommand);
      if (response.$metadata.httpStatusCode === 200) {
        res.status(200).send("Rename successful!!");
      } else {
        throw new Error("Action unsuccessful");
      }
    } 

 */

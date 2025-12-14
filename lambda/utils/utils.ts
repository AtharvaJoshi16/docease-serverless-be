import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Attachment } from "../../types/types";
import { s3Client } from "./clients";

export const getFileExtension = (fileName: string) => {
  const splitted = fileName.split(".");
  console.log(splitted);
  return splitted[splitted.length - 1];
};

export const addAttachments = async (files: Attachment[]) => {
  for (const f of files) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: f.key,
        Body: f.content,
        ContentType: f.contentType,
      })
    );
  }
};

export const getPresignedUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: key,
  });
  let profileImageUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 86400,
  });

  return profileImageUrl;
};

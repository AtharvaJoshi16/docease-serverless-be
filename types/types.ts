import { MultipartFile } from "lambda-multipart-parser";

export interface Attachment extends MultipartFile {
  key: string;
}

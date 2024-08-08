// src/components/FileUpload.tsx
import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";

const FileUpload: React.FC = () => {
  const chunkSize = 10 * 1024 * 1024; // 1MB

  const [files, setFiles] = useState<File[] | any[]>([]);
  const [fileStates, setFileStates] = useState<Record<number, any>>({});
  const [startUpload, setStartUpload] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // const auth = {
  //   createdBy: "629",
  //   REGION: "sg",
  //   BASE_HOSTNAME: "s3.wasabi.com",
  //   STORAGE_ZONE_NAME: "beta-vshare",
  //   ACCESS_KEY: "a4287d4c-7e6c-4643-a829f030bc10-98a9-42c3",
  //   PATH: "hell",
  //   // FILENAME: "123456789999.mkv",
  //   // FILENAME: `${Math.floor(11111 + Math.random() * 9999)}.png`,
  //   PATH_FOR_THUMBNAIL: "AAAA-BBBB-CC99",
  // };

  const auth = {
    createdBy: "629",
    PATH: "hell",
  };

  const encryptHeader = async (FILENAME: string) => {
    try {
      const secretKey = "jsje3j3,02.3j2jk";
      const key = CryptoJS.enc.Utf8.parse(secretKey);
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify({ ...auth, FILENAME }),
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
      const cipherText = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      const ivText = iv.toString(CryptoJS.enc.Base64);
      const encryptedData = `${cipherText}:${ivText}`;
      return encryptedData;
    } catch (error) {
      console.error("Error encrypting header:", error);
      return null;
    }
  };

  const initiateUpload = async (fileIndex: number, file: File | any) => {
    try {
      const _encryptHeader = await encryptHeader(file.newFilename);
      const initiateResponse = await fetch(
        "https://coding.load.vshare.net/initiate-multipart-upload",
        {
          method: "POST",
          headers: {
            encryptedheaders: _encryptHeader!,
          },
        }
      );

      if (!initiateResponse.ok) {
        throw new Error(
          `Error initiating multipart upload: ${await initiateResponse.text()}`
        );
      }

      const data = await initiateResponse.json();
      const uploadId = data.uploadId;

      if (data.isBunny) {
        // Origin flow
        return;
      }

      return {
        [fileIndex]: {
          file,
          uploadId,
          parts: [],
          retryParts: [],
          uploadFinished: false,
          progress: 0,
          startTime: Date.now(),
          timeElapsed: "",
        },
      };
    } catch (error: any) {
      console.error("Error initiating upload:", error);
      alert(`Error initiating upload: ${error.message}`);
    }
  };

  const uploadFileParts = async (fileIndex: number, file: File) => {
    const numParts = Math.ceil(file.size / chunkSize);

    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const blob = file.slice(start, end);

      try {
        await uploadPart(fileIndex, partNumber, blob);
      } catch (error) {
        console.error(`Error uploading part ${partNumber}:`, error);
        setFileStates((prev) => ({
          ...prev,
          [fileIndex]: {
            ...prev[fileIndex],
            retryParts: [
              ...prev[fileIndex].retryParts,
              { partNumber, start, end },
            ],
          },
        }));
      }
    }

    setFileStates((prev) => ({
      ...prev,
      [fileIndex]: { ...prev[fileIndex], uploadFinished: true },
    }));
  };

  const uploadPart = async (
    fileIndex: number,
    partNumber: number,
    blob: Blob
  ) => {
    // 100mb => 5mb
    // 100 / 50
    const { uploadId, file } = fileStates[fileIndex];
    const numParts = Math.ceil(file.size / chunkSize);
    const formData = new FormData();
    formData.append("partNumber", partNumber.toString());
    formData.append("uploadId", uploadId);
    const _encryptHeader = await encryptHeader(file.newFilename);
    const presignedResponse = await fetch(
      "https://coding.load.vshare.net/generate-presigned-url",
      {
        method: "POST",
        headers: {
          encryptedheaders: _encryptHeader!,
        },
        body: formData,
      }
    );

    if (!presignedResponse.ok) {
      throw new Error(
        `Error generating presigned URL for part ${partNumber}: ${await presignedResponse.text()}`
      );
    }

    const { url } = await presignedResponse.json();

    return new Promise<void>((resolve, reject) => {
      console.log({ partNumber });
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", blob.type);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFileStates((prev) => ({
            ...prev,
            [fileIndex]: {
              ...prev[fileIndex],
              parts: [
                ...prev[fileIndex].parts,
                { ETag: xhr.getResponseHeader("ETag"), PartNumber: partNumber },
              ],
            },
          }));
          console.log({ partNumber });
          const percentComplete = Math.round((partNumber * 100) / numParts);
          let allParts: any = [];
          setFileStates((prev) => ({
            ...prev,
            [fileIndex]: { ...prev[fileIndex], progress: percentComplete },
          }));

          allParts = [
            ...allParts,
            { ETag: xhr.getResponseHeader("ETag"), PartNumber: partNumber },
          ];
          // allParts.push({ ETag: xhr.getResponseHeader('ETag'), PartNumber: partNumber })

          if (percentComplete >= 100) {
            console.log({ fileStates });
            const endTime = Date.now();
            const timeTaken =
              (endTime - fileStates[fileIndex].startTime) / 1000; // time in seconds
            setFileStates((prev) => ({
              ...prev,
              [fileIndex]: {
                ...prev[fileIndex],
                uploadFinished: true,
                timeElapsed: `Upload completed in ${(timeTaken / 60).toFixed(
                  2
                )} minutes`,
              },
            }));
          }
          setUploadComplete(true);
          resolve();
        } else {
          reject(
            new Error(`Error uploading part ${partNumber}: ${xhr.statusText}`)
          );
        }
      };

      xhr.onerror = () =>
        reject(
          new Error(`Error uploading part ${partNumber}: ${xhr.statusText}`)
        );

      xhr.send(blob);
    });
  };

  const tryCompleteMultipartUpload = async (
    fileIndex: number,
    parts: any,
    uploadId: string,
    newFilename: string
  ) => {
    setUploadComplete(false);
    const formData = new FormData();
    formData.append("parts", JSON.stringify(parts));
    formData.append("uploadId", uploadId);
    const _encryptHeader = await encryptHeader(newFilename);

    try {
      const completeResponse = await fetch(
        "https://coding.load.vshare.net/complete-multipart-upload",
        {
          method: "POST",
          headers: {
            encryptedheaders: _encryptHeader!,
          },
          body: formData,
        }
      );

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        throw new Error(`Error completing multipart upload: ${errorText}`);
      }

      // setFileStates((prev) => ({ ...prev, [fileIndex]: { ...prev[fileIndex], parts: [], uploadFinished: false } }));

      const endTime = Date.now();
      const timeTaken = (endTime - fileStates[fileIndex].startTime) / 1000; // time in seconds
      setFileStates((prev) => ({
        ...prev,
        [fileIndex]: {
          ...prev[fileIndex],
          parts: [],
          uploadFinished: false,
          timeElapsed: `Upload completed in ${(timeTaken / 60).toFixed(
            2
          )} minutes`,
        },
      }));
    } catch (error: any) {
      console.error("Error completing multipart upload:", error);
      // alert(`Error completing multipart upload: ${error.message}`);
    }
  };

  const retryFailedParts = async () => {
    if (!navigator.onLine) return;
    console.log({ fileStates });

    const promises = Object.keys(fileStates).map(async (fileIndex) => {
      const { retryParts, file } = fileStates[parseInt(fileIndex)];
      console.log("start====1", fileIndex);
      setFileStates((prev) => ({
        ...prev,
        [fileIndex]: { ...prev[parseInt(fileIndex)], retryParts: [] },
      }));

      for (const { partNumber, start, end } of retryParts) {
        const blob = file.slice(start, end);
        try {
          await uploadPart(parseInt(fileIndex), partNumber, blob);
          console.log("start====2", fileIndex);
        } catch (error) {
          console.error(`Error retrying part ${partNumber}: `, error);
          setFileStates((prev) => ({
            ...prev,
            [fileIndex]: {
              ...prev[parseInt(fileIndex)],
              retryParts: [
                ...prev[parseInt(fileIndex)].retryParts,
                { partNumber, start, end },
              ],
            },
          }));
        }
      }
    });

    await Promise.all(promises);
  };

  useEffect(() => {
    const completeFunction = async () => {
      if (Object.values(fileStates).length === files.length) {
        Object.values(fileStates).map(async (fileState, fileIndex) => {
          if (
            fileState?.progress >= 100 &&
            fileState?.retryParts?.length <= 0 &&
            fileState?.parts?.length > 0 &&
            uploadComplete
          ) {
            console.log("start complete:: ", fileIndex, { fileState });
            await tryCompleteMultipartUpload(
              fileIndex,
              [...fileState?.parts],
              fileState?.uploadId,
              files[fileIndex]?.newFilename
            );
          }
        });
      }
    };
    completeFunction();
  }, [fileStates, uploadComplete]);

  useEffect(() => {
    window.addEventListener("online", retryFailedParts);
    window.addEventListener("offline", () =>
      console.log("Network connection lost")
    );

    return () => {
      window.removeEventListener("online", retryFailedParts);
      window.removeEventListener("offline", () =>
        console.log("Network connection lost")
      );
    };
  }, [fileStates]);

  useEffect(() => {
    const startUploads = async () => {
      for (const fileIndex of Object.keys(fileStates)) {
        if (!fileStates[parseInt(fileIndex)].uploadFinished) {
          uploadFileParts(
            parseInt(fileIndex),
            fileStates[parseInt(fileIndex)]?.file
          );
        }
      }
    };
    if (startUpload) {
      startUploads();
    }
  }, [startUpload]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    setStartUpload(false);
    const fileStateEntries = await Promise.all(
      files.map(async (file, index) => {
        const dataFile = file;
        const randomName = Math.floor(111111111 + Math.random() * 999999999);
        dataFile.newFilename = randomName + ".png";
        const initiatedUpload = await initiateUpload(index, dataFile);
        return initiatedUpload || {};
      })
    );

    const newFileStates = fileStateEntries.reduce(
      (acc, fileState) => ({ ...acc, ...fileState }),
      {}
    );
    setFileStates(newFileStates);
    setStartUpload(true);
  };

  return (
    <div>
      <input type="file" multiple onChange={onFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            {file.name}: {fileStates[index]?.progress}% uploaded
            {fileStates[index]?.timeElapsed && (
              <span> - {fileStates[index]?.timeElapsed}</span>
            )}
          </li>
        ))}
      </ul>
      {Object.values(fileStates).some(
        (state) => state.retryParts.length > 0
      ) && <button onClick={retryFailedParts}>Retry Failed Parts</button>}
    </div>
  );
};

export default FileUpload;

export type Storage = GenericStorage<Storage>;

export interface GenericStorage<Storage extends GenericStorage<Storage>> {
  ref(url?: string): GenericStorageReference<Storage>;
  refWith(
    ref: GenericStorageReference<Storage>,
    url?: string,
  ): GenericStorageReference<Storage>;

  uploadBytes(
    ref: GenericStorageReference<Storage>,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata,
  ): Promise<UploadResult<Storage>>;
  uploadString(
    ref: GenericStorageReference<Storage>,
    value: string,
    format?: StringFormat,
    metadata?: UploadMetadata,
  ): Promise<UploadResult<Storage>>;

  getDownloadURL(ref: GenericStorageReference<Storage>): Promise<string>;

  getBlob(
    ref: GenericStorageReference<Storage>,
    maxDownloadSizeBytes?: number,
  ): Promise<Blob>;
  getBytes(
    ref: GenericStorageReference<Storage>,
    maxDownloadSizeBytes?: number,
  ): Promise<ArrayBuffer>;

  getMetadata(
    ref: GenericStorageReference<Storage>,
  ): Promise<FullMetadata<Storage>>;
  updateMetadata(
    ref: GenericStorageReference<Storage>,
    metadata: SettableMetadata,
  ): Promise<FullMetadata<Storage>>;

  deleteObject(ref: GenericStorageReference<Storage>): Promise<void>;

  list(
    ref: GenericStorageReference<Storage>,
    options?: ListOptions,
  ): Promise<ListResult<Storage>>;
  listAll(ref: GenericStorageReference<Storage>): Promise<ListResult<Storage>>;
}

export interface GenericStorageReference<
  Storage extends GenericStorage<Storage>,
> {
  /**
   * Returns a gs:// URL for this object in the form
   *   `gs://<bucket>/<path>/<to>/<object>`
   * @returns The gs:// URL.
   */
  toString(): string;
  /**
   * A reference to the root of this object's bucket.
   */
  root: GenericStorageReference<Storage>;
  /**
   * The name of the bucket containing this reference's object.
   */
  bucket: string;
  /**
   * The full path of this object.
   */
  fullPath: string;
  /**
   * The short name of this object, which is the last component of the full path.
   * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
   */
  name: string;
  /**
   * The {@link GenericStorage} instance associated with this reference.
   */
  storage: GenericStorage<Storage>;
  /**
   * A reference pointing to the parent location of this reference, or null if
   * this reference is the root.
   */
  parent: GenericStorageReference<Storage> | null;
}

/**
 * Object metadata that can be set at any time.
 * @public
 */
export declare interface SettableMetadata {
  /**
   * Served as the 'Cache-Control' header on object download.
   */
  cacheControl?: string | undefined;
  /**
   * Served as the 'Content-Disposition' header on object download.
   */
  contentDisposition?: string | undefined;
  /**
   * Served as the 'Content-Encoding' header on object download.
   */
  contentEncoding?: string | undefined;
  /**
   * Served as the 'Content-Language' header on object download.
   */
  contentLanguage?: string | undefined;
  /**
   * Served as the 'Content-Type' header on object download.
   */
  contentType?: string | undefined;
  /**
   * Additional user-defined custom metadata.
   */
  customMetadata?:
    | {
        [key: string]: string;
      }
    | undefined;
}

/**
 * Object metadata that can be set at upload.
 * @public
 */
export declare interface UploadMetadata extends SettableMetadata {
  /**
   * A Base64-encoded MD5 hash of the object being uploaded.
   */
  md5Hash?: string | undefined;
}

/**
 * The full set of object metadata, including read-only properties.
 * @public
 */
export declare interface FullMetadata<Storage extends GenericStorage<Storage>>
  extends UploadMetadata {
  /**
   * The bucket this object is contained in.
   */
  bucket: string;
  /**
   * The full path of this object.
   */
  fullPath: string;
  /**
   * The object's generation.
   * {@link https://cloud.google.com/storage/docs/metadata#generation-number}
   */
  generation: string;
  /**
   * The object's metageneration.
   * {@link https://cloud.google.com/storage/docs/metadata#generation-number}
   */
  metageneration: string;
  /**
   * The short name of this object, which is the last component of the full path.
   * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
   */
  name: string;
  /**
   * The size of this object, in bytes.
   */
  size: number;
  /**
   * A date string representing when this object was created.
   */
  timeCreated: string;
  /**
   * A date string representing when this object was last updated.
   */
  updated: string;
  /**
   * Tokens to allow access to the downloatd URL.
   */
  downloadTokens: string[] | undefined;
  /**
   * `StorageReference` associated with this upload.
   */
  ref?: GenericStorageReference<Storage> | undefined;
}

/**
 * Result returned from a non-resumable upload.
 * @public
 */
export declare interface UploadResult<Storage extends GenericStorage<Storage>> {
  /**
   * Contains the metadata sent back from the server.
   */
  readonly metadata: FullMetadata<Storage>;
  /**
   * The reference that spawned this upload.
   */
  readonly ref: GenericStorageReference<Storage>;
}

/**
 * An enumeration of the possible string formats for upload.
 * @public
 */
export type StringFormat = (typeof StringFormat)[keyof typeof StringFormat];
/**
 * An enumeration of the possible string formats for upload.
 * @public
 */
export declare const StringFormat: {
  /**
   * Indicates the string should be interpreted "raw", that is, as normal text.
   * The string will be interpreted as UTF-16, then uploaded as a UTF-8 byte
   * sequence.
   * Example: The string 'Hello! \\ud83d\\ude0a' becomes the byte sequence
   * 48 65 6c 6c 6f 21 20 f0 9f 98 8a
   */
  readonly RAW: "raw";
  /**
   * Indicates the string should be interpreted as base64-encoded data.
   * Padding characters (trailing '='s) are optional.
   * Example: The string 'rWmO++E6t7/rlw==' becomes the byte sequence
   * ad 69 8e fb e1 3a b7 bf eb 97
   */
  readonly BASE64: "base64";
  /**
   * Indicates the string should be interpreted as base64url-encoded data.
   * Padding characters (trailing '='s) are optional.
   * Example: The string 'rWmO--E6t7_rlw==' becomes the byte sequence
   * ad 69 8e fb e1 3a b7 bf eb 97
   */
  readonly BASE64URL: "base64url";
  /**
   * Indicates the string is a data URL, such as one obtained from
   * canvas.toDataURL().
   * Example: the string 'data:application/octet-stream;base64,aaaa'
   * becomes the byte sequence
   * 69 a6 9a
   * (the content-type "application/octet-stream" is also applied, but can
   * be overridden in the metadata object).
   */
  readonly DATA_URL: "data_url";
};

/**
 * Result returned by list().
 * @public
 */
export interface ListResult<Storage extends GenericStorage<Storage>> {
  /**
   * References to prefixes (sub-folders). You can call list() on them to
   * get its contents.
   *
   * Folders are implicit based on '/' in the object paths.
   * For example, if a bucket has two objects '/a/b/1' and '/a/b/2', list('/a')
   * will return '/a/b' as a prefix.
   */
  prefixes: GenericStorageReference<Storage>[];
  /**
   * Objects in this directory.
   * You can call getMetadata() and getDownloadUrl() on them.
   */
  items: GenericStorageReference<Storage>[];
  /**
   * If set, there might be more results for this list. Use this token to resume the list.
   */
  nextPageToken?: string;
}

/**
 * The options `list()` accepts.
 * @public
 */
export declare interface ListOptions {
  /**
   * If set, limits the total number of `prefixes` and `items` to return.
   * The default and maximum maxResults is 1000.
   */
  maxResults?: number;
  /**
   * The `nextPageToken` from a previous call to `list()`. If provided,
   * listing is resumed from the previous position.
   */
  pageToken?: string;
}

export function ref<Storage extends GenericStorage<Storage>>(
  storageOrRef: Storage | GenericStorageReference<Storage>,
  url?: string,
): GenericStorageReference<Storage> {
  function isStorage(
    storage: Storage | GenericStorageReference<Storage>,
  ): storage is Storage {
    return (storage as Storage).ref !== undefined;
  }
  if (isStorage(storageOrRef)) {
    return storageOrRef.ref(url);
  } else {
    return storageOrRef.storage.refWith(storageOrRef, url);
  }
}

/**
 * Uploads data to this object's location.
 * The upload is not resumable.
 * @public
 * @param ref - {@link StorageReference} where data should be uploaded.
 * @param data - The data to upload.
 * @param metadata - Metadata for the data to upload.
 * @returns A Promise containing an UploadResult
 */
export function uploadBytes<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata,
): Promise<UploadResult<Storage>> {
  return ref.storage.uploadBytes(ref, data, metadata);
}

/**
 * Uploads a string to this object's location.
 * The upload is not resumable.
 * @public
 * @param ref - {@link StorageReference} where string should be uploaded.
 * @param value - The string to upload.
 * @param format - The format of the string to upload.
 * @param metadata - Metadata for the string to upload.
 * @returns A Promise containing an UploadResult
 */
export function uploadString<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  value: string,
  format?: StringFormat,
  metadata?: UploadMetadata,
): Promise<UploadResult<Storage>> {
  return ref.storage.uploadString(ref, value, format, metadata);
}

/**
 * Returns the download URL for the given {@link StorageReference}.
 * @public
 * @param ref - {@link StorageReference} to get the download URL for.
 * @returns A `Promise` that resolves with the download
 *     URL for this object.
 */
export function getDownloadURL<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
): Promise<string> {
  return ref.storage.getDownloadURL(ref);
}

/**
 * Downloads the data at the object's location. Returns an error if the object
 * is not found.
 *
 * To use this functionality, you have to whitelist your app's origin in your
 * Cloud Storage bucket. See also
 * https://cloud.google.com/storage/docs/configuring-cors
 *
 * This API is not available in Node.
 *
 * @public
 * @param ref - StorageReference where data should be downloaded.
 * @param maxDownloadSizeBytes - If set, the maximum allowed size in bytes to
 * retrieve.
 * @returns A Promise that resolves with a Blob containing the object's bytes
 */
export function getBlob<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  maxDownloadSizeBytes?: number,
): Promise<Blob> {
  return ref.storage.getBlob(ref, maxDownloadSizeBytes);
}

/**
 * Downloads the data at the object's location. Returns an error if the object
 * is not found.
 *
 * To use this functionality, you have to whitelist your app's origin in your
 * Cloud Storage bucket. See also
 * https://cloud.google.com/storage/docs/configuring-cors
 *
 * @public
 * @param ref - StorageReference where data should be downloaded.
 * @param maxDownloadSizeBytes - If set, the maximum allowed size in bytes to
 * retrieve. May not be supported in all environments.
 * @returns A Promise containing the object's bytes
 */
export function getBytes<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  maxDownloadSizeBytes?: number,
): Promise<ArrayBuffer> {
  return ref.storage.getBytes(ref, maxDownloadSizeBytes);
}

/**
 * A `Promise` that resolves with the metadata for this object. If this
 * object doesn't exist or metadata cannot be retrieved, the promise is
 * rejected.
 * @public
 * @param ref - {@link StorageReference} to get metadata from.
 */
export function getMetadata<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
): Promise<FullMetadata<Storage>> {
  return ref.storage.getMetadata(ref);
}

/**
 * Updates the metadata for this object.
 * @public
 * @param ref - {@link StorageReference} to update metadata for.
 * @param metadata - The new metadata for the object.
 *     Only values that have been explicitly set will be changed. Explicitly
 *     setting a value to null will remove the metadata.
 * @returns A `Promise` that resolves with the new metadata for this object.
 */
export function updateMetadata<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  metadata: SettableMetadata,
): Promise<FullMetadata<Storage>> {
  return ref.storage.updateMetadata(ref, metadata);
}

/**
 * Deletes the object at this location.
 * @public
 * @param ref - {@link StorageReference} for object to delete.
 * @returns A `Promise` that resolves if the deletion succeeds.
 */
export function deleteObject<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
): Promise<void> {
  return ref.storage.deleteObject(ref);
}

/**
 * List all items (files) and prefixes (folders) under this storage reference.
 *
 * This is a helper method for calling list() repeatedly until there are
 * no more results. The default pagination size is 1000.
 *
 * Note: The results may not be consistent if objects are changed while this
 * operation is running.
 *
 * Warning: `listAll` may potentially consume too many resources if there are
 * too many results.
 * @public
 * @param ref - {@link StorageReference} to get list from.
 *
 * @returns A `Promise` that resolves with all the items and prefixes under
 *      the current storage reference. `prefixes` contains references to
 *      sub-directories and `items` contains references to objects in this
 *      folder. `nextPageToken` is never returned.
 */
export function listAll<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
): Promise<ListResult<Storage>> {
  return ref.storage.listAll(ref);
}

/**
 * List items (files) and prefixes (folders) under this storage reference.
 *
 * List API is only available for Firebase Rules Version 2.
 *
 * GCS is a key-blob store. Firebase Storage imposes the semantic of '/'
 * delimited folder structure.
 * Refer to GCS's List API if you want to learn more.
 *
 * To adhere to Firebase Rules's Semantics, Firebase Storage does not
 * support objects whose paths end with "/" or contain two consecutive
 * "/"s. Firebase Storage List API will filter these unsupported objects.
 * list() may fail if there are too many unsupported objects in the bucket.
 * @public
 *
 * @param ref - {@link StorageReference} to get list from.
 * @param options - See {@link ListOptions} for details.
 * @returns A `Promise` that resolves with the items and prefixes.
 *      `prefixes` contains references to sub-folders and `items`
 *      contains references to objects in this folder. `nextPageToken`
 *      can be used to get the rest of the results.
 */
export function list<Storage extends GenericStorage<Storage>>(
  ref: GenericStorageReference<Storage>,
  options?: ListOptions,
): Promise<ListResult<Storage>> {
  return ref.storage.list(ref, options);
}

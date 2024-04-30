import * as fb from "firebase/storage";
import {
  FullMetadata,
  GenericStorage,
  GenericStorageReference,
  ListOptions,
  ListResult,
  SettableMetadata,
  StringFormat,
  UploadMetadata,
  UploadResult,
} from "./storage";

export class ModularFirebaseStorage
  implements GenericStorage<ModularFirebaseStorage>
{
  private handle: fb.FirebaseStorage;

  constructor(storage: fb.FirebaseStorage) {
    this.handle = storage;
  }
  getBlob(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    maxDownloadSizeBytes?: number | undefined,
  ): Promise<Blob> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return fb.getBlob(ref.handle, maxDownloadSizeBytes);
  }
  getBytes(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    maxDownloadSizeBytes?: number | undefined,
  ): Promise<ArrayBuffer> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return fb.getBytes(ref.handle, maxDownloadSizeBytes);
  }
  getDownloadURL(
    ref: GenericStorageReference<ModularFirebaseStorage>,
  ): Promise<string> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return fb.getDownloadURL(ref.handle);
  }
  async uploadBytes(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata | undefined,
  ): Promise<UploadResult<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await fb.uploadBytes(ref.handle, data, metadata);

    return new ModularUploadResult(result);
  }

  async uploadString(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    value: string,
    format?: StringFormat | undefined,
    metadata?: UploadMetadata | undefined,
  ): Promise<UploadResult<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await fb.uploadString(ref.handle, value, format, metadata);
    return new ModularUploadResult(result);
  }

  ref(
    url?: string | undefined,
  ): GenericStorageReference<ModularFirebaseStorage> {
    return new ModularFirebaseStorageReference(fb.ref(this.handle, url));
  }
  refWith(
    reference: GenericStorageReference<ModularFirebaseStorage>,
    url?: string | undefined,
  ): GenericStorageReference<ModularFirebaseStorage> {
    if (!(reference instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + reference);
    return new ModularFirebaseStorageReference(fb.ref(reference.handle, url));
  }

  async updateMetadata(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    metadata: SettableMetadata,
  ): Promise<FullMetadata<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata_1 = await fb.updateMetadata(ref.handle, metadata);
    return new ModularFullMetadata(metadata_1);
  }

  async getMetadata(
    ref: GenericStorageReference<ModularFirebaseStorage>,
  ): Promise<FullMetadata<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata = await fb.getMetadata(ref.handle);
    return new ModularFullMetadata(metadata);
  }

  deleteObject(
    ref: GenericStorageReference<ModularFirebaseStorage>,
  ): Promise<void> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return fb.deleteObject(ref.handle);
  }

  async list(
    ref: GenericStorageReference<ModularFirebaseStorage>,
    options?: ListOptions | undefined,
  ): Promise<ListResult<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await fb.list(ref.handle, options);
    return new ModularListResult(result);
  }

  async listAll(
    ref: GenericStorageReference<ModularFirebaseStorage>,
  ): Promise<ListResult<ModularFirebaseStorage>> {
    if (!(ref instanceof ModularFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await fb.listAll(ref.handle);
    return new ModularListResult(result);
  }
}

class ModularUploadResult implements UploadResult<ModularFirebaseStorage> {
  private handle: fb.UploadResult;
  constructor(handle: fb.UploadResult) {
    this.handle = handle;
  }
  get metadata(): FullMetadata<ModularFirebaseStorage> {
    return new ModularFullMetadata(this.handle.metadata);
  }
  get ref(): GenericStorageReference<ModularFirebaseStorage> {
    return new ModularFirebaseStorageReference(this.handle.ref);
  }
}

class ModularUploadMetadata<HT extends fb.UploadMetadata>
  implements UploadMetadata
{
  protected handle: HT;
  constructor(handle: HT) {
    this.handle = handle;
  }
  get md5Hash(): string | undefined {
    return this.handle.md5Hash;
  }
}

class ModularFullMetadata
  extends ModularUploadMetadata<fb.FullMetadata>
  implements FullMetadata<ModularFirebaseStorage>
{
  constructor(handle: fb.FullMetadata) {
    super(handle);
  }
  get bucket(): string {
    return this.handle.bucket;
  }
  get fullPath(): string {
    return this.handle.fullPath;
  }
  get generation(): string {
    return this.handle.generation;
  }
  get metageneration(): string {
    return this.handle.metageneration;
  }
  get name(): string {
    return this.handle.name;
  }
  get size(): number {
    return this.handle.size;
  }
  get timeCreated(): string {
    return this.handle.timeCreated;
  }
  get updated(): string {
    return this.handle.updated;
  }
  get downloadTokens(): string[] | undefined {
    return this.handle.downloadTokens;
  }
  get ref(): GenericStorageReference<ModularFirebaseStorage> | undefined {
    if (this.handle.ref) {
      return new ModularFirebaseStorageReference(this.handle.ref);
    }
    return undefined;
  }
}

class ModularFirebaseStorageReference
  implements GenericStorageReference<ModularFirebaseStorage>
{
  handle: fb.StorageReference;
  constructor(handle: fb.StorageReference) {
    this.handle = handle;
  }
  toString(): string {
    return this.handle.toString();
  }
  get root(): GenericStorageReference<ModularFirebaseStorage> {
    return new ModularFirebaseStorageReference(this.handle.root);
  }
  get bucket(): string {
    return this.handle.bucket;
  }
  get fullPath(): string {
    return this.handle.fullPath;
  }
  get name(): string {
    return this.handle.name;
  }
  get storage(): GenericStorage<ModularFirebaseStorage> {
    return new ModularFirebaseStorage(this.handle.storage);
  }
  get parent(): GenericStorageReference<ModularFirebaseStorage> | null {
    const parent = this.handle.parent;
    if (parent) {
      return new ModularFirebaseStorageReference(parent);
    }
    return null;
  }
}

class ModularListResult implements ListResult<ModularFirebaseStorage> {
  handle: fb.ListResult;
  constructor(handle: fb.ListResult) {
    this.handle = handle;
  }
  get items(): GenericStorageReference<ModularFirebaseStorage>[] {
    return this.handle.items.map(
      (item) => new ModularFirebaseStorageReference(item),
    );
  }
  get prefixes(): GenericStorageReference<ModularFirebaseStorage>[] {
    return this.handle.prefixes.map(
      (item) => new ModularFirebaseStorageReference(item),
    );
  }
  get nextPageToken(): string | undefined {
    return this.handle.nextPageToken;
  }
}

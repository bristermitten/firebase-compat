import firebase from "firebase/compat/app";
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

export class CompatFirebaseStorage
  implements GenericStorage<CompatFirebaseStorage>
{
  private handle: firebase.storage.Storage;

  constructor(storage: firebase.storage.Storage) {
    this.handle = storage;
  }
  async getBlob(
    ref: GenericStorageReference<CompatFirebaseStorage>
  ): Promise<Blob> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const url = await ref.handle.getDownloadURL();
    return fetch(url).then((response) => response.blob());
  }
  async getBytes(
    ref: GenericStorageReference<CompatFirebaseStorage>,
  ): Promise<ArrayBuffer> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);

    const url = await ref.handle.getDownloadURL();
    return fetch(url).then((response) => response.arrayBuffer());
  }
  getDownloadURL(
    ref: GenericStorageReference<CompatFirebaseStorage>,
  ): Promise<string> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return ref.handle.getDownloadURL();
  }
  async uploadBytes(
    ref: GenericStorageReference<CompatFirebaseStorage>,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata | undefined,
  ): Promise<UploadResult<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.put(data, metadata);

    return new CompatUploadResult(result);
  }

  async uploadString(
    ref: GenericStorageReference<CompatFirebaseStorage>,
    value: string,
    format?: StringFormat | undefined,
    metadata?: UploadMetadata | undefined,
  ): Promise<UploadResult<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.putString(value, format, metadata);
    return new CompatUploadResult(result);
  }

  ref(
    url?: string | undefined,
  ): GenericStorageReference<CompatFirebaseStorage> {
    return new CompatFirebaseStorageReference(this.handle.ref(url));
  }
  refWith(
    reference: GenericStorageReference<CompatFirebaseStorage>,
    url?: string | undefined,
  ): GenericStorageReference<CompatFirebaseStorage> {
    if (!(reference instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + reference);
    return url
      ? new CompatFirebaseStorageReference(reference.handle.child(url))
      : reference;
  }

  async updateMetadata(
    ref: GenericStorageReference<CompatFirebaseStorage>,
    metadata: SettableMetadata,
  ): Promise<FullMetadata<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata_1 = await ref.handle.updateMetadata(metadata);
    return new CompatFullMetadata(metadata_1, ref.handle);
  }

  async getMetadata(
    ref: GenericStorageReference<CompatFirebaseStorage>,
  ): Promise<FullMetadata<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata = await ref.handle.getMetadata();
    return new CompatFullMetadata(metadata, ref.handle);
  }

  deleteObject(
    ref: GenericStorageReference<CompatFirebaseStorage>,
  ): Promise<void> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return ref.handle.delete();
  }

  async list(
    ref: GenericStorageReference<CompatFirebaseStorage>,
    options?: ListOptions | undefined,
  ): Promise<ListResult<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.list(options);
    return new CompatListResult(result);
  }

  async listAll(
    ref: GenericStorageReference<CompatFirebaseStorage>,
  ): Promise<ListResult<CompatFirebaseStorage>> {
    if (!(ref instanceof CompatFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.listAll();
    return new CompatListResult(result);
  }
}

class CompatUploadResult implements UploadResult<CompatFirebaseStorage> {
  private handle: firebase.storage.UploadTaskSnapshot;
  constructor(handle: firebase.storage.UploadTaskSnapshot) {
    this.handle = handle;
  }
  get metadata(): FullMetadata<CompatFirebaseStorage> {
    return new CompatFullMetadata(this.handle.metadata, this.handle.ref);
  }
  get ref(): GenericStorageReference<CompatFirebaseStorage> {
    return new CompatFirebaseStorageReference(this.handle.ref);
  }
}

class CompatUploadMetadata<HT extends firebase.storage.UploadMetadata>
  implements UploadMetadata
{
  protected handle: HT;
  constructor(handle: HT) {
    this.handle = handle;
  }
  get md5Hash(): string | undefined {
    return this.handle.md5Hash || undefined;
  }
}

class CompatFullMetadata
  extends CompatUploadMetadata<firebase.storage.FullMetadata>
  implements FullMetadata<CompatFirebaseStorage>
{
  private handleRef?: firebase.storage.Reference;
  constructor(
    handle: firebase.storage.FullMetadata,
    handleRef: firebase.storage.Reference | undefined,
  ) {
    super(handle);
    this.handleRef = handleRef;
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
    return undefined;
  }
  get ref(): GenericStorageReference<CompatFirebaseStorage> | undefined {
    if (this.handleRef) {
      return new CompatFirebaseStorageReference(this.handleRef);
    }
    return undefined;
  }
}

class CompatFirebaseStorageReference
  implements GenericStorageReference<CompatFirebaseStorage>
{
  handle: firebase.storage.Reference;
  constructor(handle: firebase.storage.Reference) {
    this.handle = handle;
  }
  toString(): string {
    return this.handle.toString();
  }
  get root(): GenericStorageReference<CompatFirebaseStorage> {
    return new CompatFirebaseStorageReference(this.handle.root);
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
  get storage(): GenericStorage<CompatFirebaseStorage> {
    return new CompatFirebaseStorage(this.handle.storage);
  }
  get parent(): GenericStorageReference<CompatFirebaseStorage> | null {
    const parent = this.handle.parent;
    if (parent) {
      return new CompatFirebaseStorageReference(parent);
    }
    return null;
  }
}

class CompatListResult implements ListResult<CompatFirebaseStorage> {
  handle: firebase.storage.ListResult;
  constructor(handle: firebase.storage.ListResult) {
    this.handle = handle;
  }
  get items(): GenericStorageReference<CompatFirebaseStorage>[] {
    return this.handle.items.map(
      (item) => new CompatFirebaseStorageReference(item),
    );
  }
  get prefixes(): GenericStorageReference<CompatFirebaseStorage>[] {
    return this.handle.prefixes.map(
      (item) => new CompatFirebaseStorageReference(item),
    );
  }
  get nextPageToken(): string | undefined {
    return this.handle.nextPageToken || undefined;
  }
}

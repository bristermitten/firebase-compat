import { FirebaseStorageTypes } from "@react-native-firebase/storage";
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

export class RNFirebaseStorage implements GenericStorage<RNFirebaseStorage> {
  private handle: FirebaseStorageTypes.Module;

  constructor(storage: FirebaseStorageTypes.Module) {
    this.handle = storage;
  }
  async getBlob(
    ref: GenericStorageReference<RNFirebaseStorage>
  ): Promise<Blob> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const url = await ref.handle.getDownloadURL();
    return fetch(url).then((response) => response.blob());
  }
  async getBytes(
    ref: GenericStorageReference<RNFirebaseStorage>
  ): Promise<ArrayBuffer> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);

    const url = await ref.handle.getDownloadURL();
    return fetch(url).then((response) => response.arrayBuffer());
  }
  getDownloadURL(
    ref: GenericStorageReference<RNFirebaseStorage>
  ): Promise<string> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return ref.handle.getDownloadURL();
  }
  async uploadBytes(
    ref: GenericStorageReference<RNFirebaseStorage>,
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: UploadMetadata | undefined
  ): Promise<UploadResult<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.put(data, metadata);

    return new RNUploadResult(result);
  }

  async uploadString(
    ref: GenericStorageReference<RNFirebaseStorage>,
    value: string,
    format?: StringFormat | undefined,
    metadata?: UploadMetadata | undefined
  ): Promise<UploadResult<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.putString(value, format, metadata);
    return new RNUploadResult(result);
  }

  ref(url?: string | undefined): GenericStorageReference<RNFirebaseStorage> {
    return new RNFirebaseStorageReference(this.handle.ref(url));
  }
  refWith(
    reference: GenericStorageReference<RNFirebaseStorage>,
    url?: string | undefined
  ): GenericStorageReference<RNFirebaseStorage> {
    if (!(reference instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + reference);
    return url
      ? new RNFirebaseStorageReference(reference.handle.child(url))
      : reference;
  }

  async updateMetadata(
    ref: GenericStorageReference<RNFirebaseStorage>,
    metadata: SettableMetadata
  ): Promise<FullMetadata<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata_1 = await ref.handle.updateMetadata(metadata);
    return new RNFullMetadata(metadata_1, ref.handle);
  }

  async getMetadata(
    ref: GenericStorageReference<RNFirebaseStorage>
  ): Promise<FullMetadata<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const metadata = await ref.handle.getMetadata();
    return new RNFullMetadata(metadata, ref.handle);
  }

  deleteObject(ref: GenericStorageReference<RNFirebaseStorage>): Promise<void> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    return ref.handle.delete();
  }

  async list(
    ref: GenericStorageReference<RNFirebaseStorage>,
    options?: ListOptions | undefined
  ): Promise<ListResult<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.list(options);
    return new RNListResult(result);
  }

  async listAll(
    ref: GenericStorageReference<RNFirebaseStorage>
  ): Promise<ListResult<RNFirebaseStorage>> {
    if (!(ref instanceof RNFirebaseStorageReference))
      throw new Error("Invalid storage reference: " + ref);
    const result = await ref.handle.listAll();
    return new RNListResult(result);
  }
}

class RNUploadResult implements UploadResult<RNFirebaseStorage> {
  private handle: FirebaseStorageTypes.TaskResult;
  constructor(handle: FirebaseStorageTypes.TaskResult) {
    this.handle = handle;
  }
  get metadata(): FullMetadata<RNFirebaseStorage> {
    return new RNFullMetadata(this.handle.metadata, this.handle.ref);
  }
  get ref(): GenericStorageReference<RNFirebaseStorage> {
    return new RNFirebaseStorageReference(this.handle.ref);
  }
}

class RNUploadMetadata<HT extends FirebaseStorageTypes.SettableMetadata>
  implements UploadMetadata
{
  protected handle: HT;
  constructor(handle: HT) {
    this.handle = handle;
  }
  get md5Hash(): string | undefined {
    return this.handle.md5hash || undefined;
  }
}

class RNFullMetadata
  extends RNUploadMetadata<FirebaseStorageTypes.FullMetadata>
  implements FullMetadata<RNFirebaseStorage>
{
  private handleRef?: FirebaseStorageTypes.Reference;
  constructor(
    handle: FirebaseStorageTypes.FullMetadata,
    handleRef: FirebaseStorageTypes.Reference | undefined
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
  get ref(): GenericStorageReference<RNFirebaseStorage> | undefined {
    if (this.handleRef) {
      return new RNFirebaseStorageReference(this.handleRef);
    }
    return undefined;
  }
}

class RNFirebaseStorageReference
  implements GenericStorageReference<RNFirebaseStorage>
{
  handle: FirebaseStorageTypes.Reference;
  constructor(handle: FirebaseStorageTypes.Reference) {
    this.handle = handle;
  }
  toString(): string {
    return this.handle.toString();
  }
  get root(): GenericStorageReference<RNFirebaseStorage> {
    return new RNFirebaseStorageReference(this.handle.root);
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
  get storage(): GenericStorage<RNFirebaseStorage> {
    return new RNFirebaseStorage(this.handle.storage);
  }
  get parent(): GenericStorageReference<RNFirebaseStorage> | null {
    const parent = this.handle.parent;
    if (parent) {
      return new RNFirebaseStorageReference(parent);
    }
    return null;
  }
}

class RNListResult implements ListResult<RNFirebaseStorage> {
  handle: FirebaseStorageTypes.ListResult;
  constructor(handle: FirebaseStorageTypes.ListResult) {
    this.handle = handle;
  }
  get items(): GenericStorageReference<RNFirebaseStorage>[] {
    return this.handle.items.map(
      (item) => new RNFirebaseStorageReference(item)
    );
  }
  get prefixes(): GenericStorageReference<RNFirebaseStorage>[] {
    return this.handle.prefixes.map(
      (item) => new RNFirebaseStorageReference(item)
    );
  }
  get nextPageToken(): string | undefined {
    return this.handle.nextPageToken || undefined;
  }
}

export type UnknownFirestore = GenericFirestore<UnknownFirestore>;

export type CollectionReference = GenericCollectionReference<UnknownFirestore>;

export type DocumentReference = GenericDocumentReference<UnknownFirestore>;

export type DocumentData = GenericDocumentData;

export type QuerySnapshot = GenericQuerySnapshot<UnknownFirestore>;

export type QueryDocumentSnapshot =
  GenericQueryDocumentSnapshot<UnknownFirestore>;

export type DocumentSnapshot = GenericDocumentSnapshot<UnknownFirestore>;

export type Query = GenericQuery<UnknownFirestore>;

export type QueryConstraint = GenericQueryConstraint;

export type QueryConstraintType = GenericQueryConstraintType;

export type QueryFieldFilterConstraint = GenericQueryFieldFilterConstraint;

export type QueryLike = GenericQueryLike<UnknownFirestore>;

export interface GenericFirestore<DB extends GenericFirestore<DB>> {
  collection(
    path: string,
    ...pathSegments: string[]
  ): GenericCollectionReference<DB>;

  doc(path: string, ...pathSegments: string[]): GenericDocumentReference<DB>;

  getDocs(
    collectionReference: GenericQueryLike<DB>
  ): Promise<GenericQuerySnapshot<DB>>;

  getDoc(
    documentReference: GenericDocumentReference<DB>
  ): Promise<GenericDocumentSnapshot<DB>>;

  addDoc(
    collectionReference: GenericCollectionReference<DB>,
    data: GenericDocumentData
  ): Promise<GenericDocumentReference<DB>>;

  setDoc(
    documentReference: GenericDocumentReference<DB>,
    data: GenericDocumentData
  ): Promise<void>;

  deleteDoc(documentReference: GenericDocumentReference<DB>): Promise<void>;

  query(
    query: GenericQueryLike<DB>,
    ...queryConstraints: GenericQueryConstraint[]
  ): GenericQueryLike<DB>;

  onSnapshotQuery(
    query: GenericQuery<DB>,
    options: SnapshotListenOptions,
    onNext: ((snapshot: GenericQuerySnapshot<DB>) => void) | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore;

  onSnapshot(
    documentReference: GenericDocumentReference<DB>,
    options: SnapshotListenOptions,
    onNext: ((snapshot: GenericDocumentSnapshot<DB>) => void) | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore;
}

export abstract class GenericCollectionReference<
  DB extends GenericFirestore<DB>
> implements GenericQueryLike<DB>
{
  abstract get database(): DB;
  abstract get handle(): unknown;
  readonly type = "collection" as const;

  abstract get id(): string;

  abstract get path(): string;

  abstract get parent(): GenericDocumentReference<DB> | null;
}

export interface GenericDocumentReference<DB extends GenericFirestore<DB>> {
  get id(): string;

  get path(): string;

  get parent(): GenericCollectionReference<DB>;

  get firestore(): GenericFirestore<DB>;
}

export interface GenericDocumentData {
  /** A mapping between a field and its value. */
  [field: string]: unknown;
}

export abstract class GenericQuerySnapshot<DB extends GenericFirestore<DB>> {
  abstract get docs(): Array<GenericQueryDocumentSnapshot<DB>>;
  /** The number of documents in the `QuerySnapshot`. */
  abstract get size(): number;
  /** True if there are no documents in the `QuerySnapshot`. */
  abstract get empty(): boolean;

  forEach(
    callback: (result: GenericQueryDocumentSnapshot<DB>) => void,
    thisArg?: unknown
  ): void {
    this.docs.forEach(callback, thisArg);
  }
}

export interface GenericQueryDocumentSnapshot<DB extends GenericFirestore<DB>>
  extends GenericDocumentSnapshot<DB> {
  data(): GenericDocumentData;
}

export abstract class GenericDocumentSnapshot<DB extends GenericFirestore<DB>> {
  /**
   * Returns whether or not the data exists. True if the document exists.
   */
  abstract exists(): this is GenericQueryDocumentSnapshot<DB>;
  /**
   * Retrieves all fields in the document as an `Object`. Returns `undefined` if
   * the document doesn't exist.
   *
   * By default, `serverTimestamp()` values that have not yet been
   * set to their final value will be returned as `null`. You can override
   * this by passing an options object.
   *
   * @param options - An options object to configure how data is retrieved from
   * the snapshot (for example the desired behavior for server timestamps that
   * have not yet been set to their final value).
   * @returns An `Object` containing all fields in the document or `undefined` if
   * the document doesn't exist.
   */
  abstract data(): GenericDocumentData | undefined;
  /**
   * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
   * document or field doesn't exist.
   *
   * By default, a `serverTimestamp()` that has not yet been set to
   * its final value will be returned as `null`. You can override this by
   * passing an options object.
   *
   * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
   * field.
   * @param options - An options object to configure how the field is retrieved
   * from the snapshot (for example the desired behavior for server timestamps
   * that have not yet been set to their final value).
   * @returns The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  abstract get(fieldPath: string): unknown;
  /**
   * Property of the `DocumentSnapshot` that provides the document's ID.
   */
  abstract get id(): string;
  /**
   * The `DocumentReference` for the document included in the `DocumentSnapshot`.
   */
  abstract get ref(): GenericDocumentReference<DB>;
}

export interface GenericQueryLike<DB extends GenericFirestore<DB>> {
  get database(): DB;
  get handle(): unknown;
  readonly type: "query" | "collection";
}

export abstract class GenericQuery<DB extends GenericFirestore<DB>>
  implements GenericQueryLike<DB>
{
  readonly type = "query";
  abstract get handle(): unknown;
  abstract get database(): DB;

  abstract where(
    fieldPath: string,
    opStr: WhereFilterOp,
    value: unknown
  ): GenericQuery<DB>;
  abstract orderBy(
    fieldPath: string,
    directionStr?: OrderByDirection
  ): GenericQuery<DB>;
  abstract limit(limit: number): GenericQuery<DB>;
}
export interface GenericQueryConstraint {
  readonly type: GenericQueryConstraintType;

  apply<T extends GenericFirestore<T>>(query: GenericQuery<T>): GenericQuery<T>;
}

export class GenericQueryFieldFilterConstraint
  implements GenericQueryConstraint
{
  /** The type of this query constraint */
  readonly type = "where";

  private readonly fieldPath: string;
  private readonly opStr: WhereFilterOp;
  private readonly value: unknown;

  constructor(fieldPath: string, opStr: WhereFilterOp, value: unknown) {
    this.fieldPath = fieldPath;
    this.opStr = opStr;
    this.value = value;
  }

  apply<DB extends GenericFirestore<DB>>(
    query: GenericQuery<DB>
  ): GenericQuery<DB> {
    return query.where(this.fieldPath, this.opStr, this.value);
  }
}

export class GenericQueryOrderByConstraint implements GenericQueryConstraint {
  /** The type of this query constraint */
  readonly type = "orderBy";

  private readonly fieldPath: string;
  private readonly directionStr?: OrderByDirection;

  constructor(fieldPath: string, directionStr?: OrderByDirection) {
    this.fieldPath = fieldPath;
    this.directionStr = directionStr;
  }

  apply<DB extends GenericFirestore<DB>>(
    query: GenericQuery<DB>
  ): GenericQuery<DB> {
    return query.orderBy(this.fieldPath, this.directionStr);
  }
}

export class GenericQueryLimitConstraint implements GenericQueryConstraint {
  /** The type of this query constraint */
  readonly type = "limit";

  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  apply<DB extends GenericFirestore<DB>>(
    query: GenericQuery<DB>
  ): GenericQuery<DB> {
    return query.limit(this.limit);
  }
}

export type OrderByDirection = "desc" | "asc";

export type WhereFilterOp =
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">"
  | "array-contains"
  | "in"
  | "array-contains-any"
  | "not-in";

export type GenericQueryConstraintType =
  | "where"
  | "orderBy"
  | "limit"
  | "limitToLast"
  | "startAt"
  | "startAfter"
  | "endAt"
  | "endBefore";

/**
 * An options object that can be passed to {@link (onSnapshot:1)} and {@link
 * QuerySnapshot.docChanges} to control which types of changes to include in the
 * result set.
 */
export interface SnapshotListenOptions {
  /**
   * Include a change even if only the metadata of the query or of a document
   * changed. Default is false.
   */
  readonly includeMetadataChanges?: boolean;
}
/**
 * A function returned by `onSnapshot()` that removes the listener when invoked.
 */
export interface UnsubscribeFirestore {
  /** Removes the listener when invoked. */
  (): void;
}

export function collection<DB extends GenericFirestore<DB>>(
  firestore: GenericFirestore<DB>,
  path: string,
  ...pathSegments: string[]
): GenericCollectionReference<DB> {
  return firestore.collection(path, ...pathSegments);
}

export function doc<DB extends GenericFirestore<DB>>(
  firestore: GenericFirestore<DB>,
  path: string,
  ...pathSegments: string[]
): GenericDocumentReference<DB> {
  return firestore.doc(path, ...pathSegments);
}

export function getDocs<DB extends GenericFirestore<DB>>(
  query: GenericQueryLike<DB>
): Promise<GenericQuerySnapshot<DB>> {
  return query.database.getDocs(query);
}

export function getDoc<DB extends GenericFirestore<DB>>(
  documentReference: GenericDocumentReference<DB>
): Promise<GenericDocumentSnapshot<DB>> {
  return documentReference.firestore.getDoc(documentReference);
}

export function addDoc<DB extends GenericFirestore<DB>>(
  collectionReference: GenericCollectionReference<DB>,
  data: GenericDocumentData
): Promise<GenericDocumentReference<DB>> {
  return collectionReference.database.addDoc(collectionReference, data);
}

export function deleteDoc<DB extends GenericFirestore<DB>>(
  documentReference: GenericDocumentReference<DB>
): Promise<void> {
  return documentReference.firestore.deleteDoc(documentReference);
}

export function setDoc<DB extends GenericFirestore<DB>>(
  documentReference: GenericDocumentReference<DB>,
  data: GenericDocumentData
): Promise<void> {
  return documentReference.firestore.setDoc(documentReference, data);
}

export function query<DB extends GenericFirestore<DB>>(
  query: GenericQueryLike<DB>,
  ...queryConstraints: GenericQueryConstraint[]
): GenericQueryLike<DB> {
  return query.database.query(query, ...queryConstraints);
}

export function where(
  fieldPath: string,
  opStr: WhereFilterOp,
  value: unknown
): GenericQueryConstraint {
  return new GenericQueryFieldFilterConstraint(fieldPath, opStr, value);
}

export function orderBy(
  fieldPath: string,
  directionStr?: OrderByDirection
): GenericQueryConstraint {
  return new GenericQueryOrderByConstraint(fieldPath, directionStr);
}

export function limit(limit: number): GenericQueryConstraint {
  return new GenericQueryLimitConstraint(limit);
}

/**
 * Attaches a listener for `DocumentSnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks.
 *
 * NOTE: Although an `onCompletion` callback can be provided, it will
 * never be called because the snapshot stream is never-ending.
 *
 * @param reference - A reference to the document to listen to.
 * * @param options - Options controlling the listen behavior.
 * @param observer - A single object containing `next` and `error` callbacks.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshot<DB extends GenericFirestore<DB>>(
  reference: GenericDocumentReference<DB>,
  options: SnapshotListenOptions | undefined,
  observer: {
    next?: (snapshot: GenericDocumentSnapshot<DB>) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }
): UnsubscribeFirestore {
  return reference.firestore.onSnapshot(
    reference,
    options ?? {},
    observer.next,
    observer.error,
    observer.complete
  );
}
/**
 * Attaches a listener for `QuerySnapshot` events. You may either pass
 * individual `onNext` and `onError` callbacks or pass a single observer
 * object with `next` and `error` callbacks. The listener can be cancelled by
 * calling the function that is returned when `onSnapshot` is called.
 *
 * NOTE: Although an `onCompletion` callback can be provided, it will
 * never be called because the snapshot stream is never-ending.
 *
 * @param query - The query to listen to.
 * @param options - Options controlling the listen behavior.
 * @param onNext - A callback to be called every time a new `QuerySnapshot`
 * is available.
 * @param onCompletion - Can be provided, but will not be called since streams are
 * never ending.
 * @param onError - A callback to be called if the listen fails or is
 * cancelled. No further callbacks will occur.
 * @returns An unsubscribe function that can be called to cancel
 * the snapshot listener.
 */
export function onSnapshotQuery<DB extends GenericFirestore<DB>>(
  query: GenericQuery<DB>,
  options: SnapshotListenOptions,
  onNext: (snapshot: GenericQuerySnapshot<DB>) => void,
  onError?: (error: Error) => void,
  onCompletion?: () => void
): UnsubscribeFirestore {
  return query.database.onSnapshotQuery(
    query,
    options,
    onNext,
    onError,
    onCompletion
  );
}

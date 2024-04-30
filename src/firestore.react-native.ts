import {
  GenericCollectionReference,
  GenericDocumentData,
  GenericDocumentReference,
  GenericDocumentSnapshot,
  GenericFirestore,
  GenericQuery,
  GenericQueryConstraint,
  GenericQueryDocumentSnapshot,
  GenericQueryLike,
  GenericQuerySnapshot,
  OrderByDirection,
  SnapshotListenOptions,
  UnsubscribeFirestore,
  WhereFilterOp,
} from "./firestore";

import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { joinPath, sanitiseObject } from "./utils";

export class RNFirebaseFirestore
  implements GenericFirestore<RNFirebaseFirestore>
{
  private firestore: FirebaseFirestoreTypes.Module;

  constructor(firestore: FirebaseFirestoreTypes.Module) {
    this.firestore = firestore;
  }
  onSnapshotQuery(
    query: GenericQuery<RNFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericQuerySnapshot<RNFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(query instanceof RNFirebaseQuery))
      throw new Error("Invalid query: " + query);
    const wrappedOptions: FirebaseFirestoreTypes.SnapshotListenOptions = {
      includeMetadataChanges: options.includeMetadataChanges ?? false,
    };
    return query.query.onSnapshot(wrappedOptions, {
      next: (snapshot) => {
        onNext?.(new RNFirebaseQuerySnapshot(this, snapshot));
      },
      error: (error) => {
        onError?.(error);
      },
      complete: () => {
        onCompletion?.();
      },
    });
  }
  onSnapshot(
    documentReference: GenericDocumentReference<RNFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericDocumentSnapshot<RNFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(documentReference instanceof RNFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    const wrappedOptions: FirebaseFirestoreTypes.SnapshotListenOptions = {
      includeMetadataChanges: options.includeMetadataChanges ?? false,
    };
    return documentReference.document.onSnapshot(wrappedOptions, {
      next: (snapshot) => {
        onNext?.(new RNFirebaseDocumentSnapshot(this, snapshot));
      },
      error: (error) => {
        onError?.(error);
      },
      complete: () => {
        onCompletion?.();
      },
    });
  }
  setDoc(
    documentReference: GenericDocumentReference<RNFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<void> {
    if (!(documentReference instanceof RNFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return documentReference.document.set(data);
  }

  async getDoc(
    documentReference: GenericDocumentReference<RNFirebaseFirestore>
  ): Promise<GenericDocumentSnapshot<RNFirebaseFirestore>> {
    if (!(documentReference instanceof RNFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    const doc = await documentReference.document.get();
    return new RNFirebaseDocumentSnapshot(this, doc);
  }
  query(
    query: GenericQueryLike<RNFirebaseFirestore>,
    ...queryConstraints: GenericQueryConstraint[]
  ): GenericQueryLike<RNFirebaseFirestore> {
    const ref = query.handle as FirebaseFirestoreTypes.Query;

    let gq: GenericQuery<RNFirebaseFirestore> = new RNFirebaseQuery(this, ref);

    for (const constraint of queryConstraints) {
      gq = constraint.apply(gq);
    }

    return gq;
  }
  deleteDoc(
    documentReference: GenericDocumentReference<RNFirebaseFirestore>
  ): Promise<void> {
    if (!(documentReference instanceof RNFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return documentReference.document.delete();
  }
  async getDocs(
    collectionReference: GenericCollectionReference<RNFirebaseFirestore>
  ): Promise<GenericQuerySnapshot<RNFirebaseFirestore>> {
    const query = collectionReference.handle as FirebaseFirestoreTypes.Query;
    const docs = await query.get();
    return new RNFirebaseQuerySnapshot(this, docs);
  }
  doc(
    path: string,
    ...pathSegments: string[]
  ): GenericDocumentReference<RNFirebaseFirestore> {
    const document = this.firestore.doc(joinPath(path, ...pathSegments));
    return new RNFirebaseDocumentReference(this, document);
  }

  collection(
    path: string,
    ...pathSegments: string[]
  ): GenericCollectionReference<RNFirebaseFirestore> {
    const col = this.firestore.collection(joinPath(path, ...pathSegments));

    return new RNFirebaseCollectionReference(this, col);
  }

  async addDoc(
    collectionReference: GenericCollectionReference<RNFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<GenericDocumentReference<RNFirebaseFirestore>> {
    if (!(collectionReference instanceof RNFirebaseCollectionReference))
      throw new Error("Invalid collection reference: " + collectionReference);
    const doc = await collectionReference.collection.add(data);
    return new RNFirebaseDocumentReference(this, doc);
  }
}
class RNFirebaseDocumentSnapshot<KnownToExist = false>
  implements GenericDocumentSnapshot<RNFirebaseFirestore>
{
  database: RNFirebaseFirestore;
  snapshot: KnownToExist extends true
    ? FirebaseFirestoreTypes.QueryDocumentSnapshot
    : FirebaseFirestoreTypes.DocumentSnapshot;

  constructor(
    database: RNFirebaseFirestore,
    snapshot: KnownToExist extends true
      ? FirebaseFirestoreTypes.QueryDocumentSnapshot
      : FirebaseFirestoreTypes.DocumentSnapshot
  ) {
    this.database = database;
    this.snapshot = snapshot;
  }
  exists(): this is GenericQueryDocumentSnapshot<RNFirebaseFirestore> {
    return this.snapshot.exists;
  }
  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  data(): GenericDocumentData | undefined {
    const data = this.snapshot.data();
    if (!data) return undefined;
    return new RNFirebaseDocumentData(data);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<RNFirebaseFirestore> {
    return new RNFirebaseDocumentReference(this.database, this.snapshot.ref);
  }
}

class RNFirebaseQueryDocumentSnapshot
  extends RNFirebaseDocumentSnapshot<true>
  implements GenericQueryDocumentSnapshot<RNFirebaseFirestore>
{
  constructor(
    database: RNFirebaseFirestore,
    snapshot: FirebaseFirestoreTypes.QueryDocumentSnapshot
  ) {
    super(database, snapshot);
  }
  exists(): this is GenericQueryDocumentSnapshot<RNFirebaseFirestore> {
    return true;
  }

  data(): GenericDocumentData {
    const data = this.snapshot.data();
    return new RNFirebaseDocumentData(data);
  }

  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<RNFirebaseFirestore> {
    return new RNFirebaseDocumentReference(this.database, this.snapshot.ref);
  }
}

class RNFirebaseQuery extends GenericQuery<RNFirebaseFirestore> {
  get handle(): unknown {
    return this.query;
  }
  query: FirebaseFirestoreTypes.Query;
  database: RNFirebaseFirestore;

  constructor(
    database: RNFirebaseFirestore,
    query: FirebaseFirestoreTypes.Query
  ) {
    super();
    this.database = database;
    this.query = query;
  }

  orderBy(
    fieldPath: string,
    directionStr?: OrderByDirection | undefined
  ): GenericQuery<RNFirebaseFirestore> {
    return new RNFirebaseQuery(
      this.database,
      this.query.orderBy(fieldPath, directionStr)
    );
  }
  limit(limit: number): GenericQuery<RNFirebaseFirestore> {
    return new RNFirebaseQuery(this.database, this.query.limit(limit));
  }
  where(
    fieldPath: string,
    opStr: WhereFilterOp,
    value: unknown
  ): GenericQuery<RNFirebaseFirestore> {
    return new RNFirebaseQuery(
      this.database,
      this.query.where(fieldPath, opStr, value)
    );
  }
}
class RNFirebaseQuerySnapshot extends GenericQuerySnapshot<RNFirebaseFirestore> {
  private database: RNFirebaseFirestore;
  private snapshot: FirebaseFirestoreTypes.QuerySnapshot;

  constructor(
    database: RNFirebaseFirestore,
    snapshot: FirebaseFirestoreTypes.QuerySnapshot
  ) {
    super();
    this.database = database;
    this.snapshot = snapshot;
  }
  get docs(): GenericQueryDocumentSnapshot<RNFirebaseFirestore>[] {
    return this.snapshot.docs.map(
      (doc) => new RNFirebaseQueryDocumentSnapshot(this.database, doc)
    );
  }
  get size(): number {
    return this.snapshot.size;
  }
  get empty(): boolean {
    return this.snapshot.empty;
  }
}

class RNFirebaseDocumentData implements GenericDocumentData {
  constructor(data: FirebaseFirestoreTypes.DocumentData) {
    Object.assign(
      this,
      sanitiseObject(data, (_field, value) => {
        if (
          value &&
          typeof value === "object" &&
          "toDate" in value &&
          typeof value.toDate === "function" &&
          "seconds" in value &&
          "nanoseconds" in value
        ) {
          return value.toDate();
        }
        return value;
      })
    );
  }
  [field: string]: unknown;
}

class RNFirebaseCollectionReference extends GenericCollectionReference<RNFirebaseFirestore> {
  collection: FirebaseFirestoreTypes.CollectionReference;
  firestore: RNFirebaseFirestore;

  get handle(): unknown {
    return this.collection;
  }

  constructor(
    firestore: RNFirebaseFirestore,
    collection: FirebaseFirestoreTypes.CollectionReference
  ) {
    super();
    this.firestore = firestore;
    this.collection = collection;
  }

  get database(): RNFirebaseFirestore {
    return this.firestore;
  }

  get id(): string {
    return this.collection.id;
  }
  get path(): string {
    return this.collection.path;
  }
  get parent(): GenericDocumentReference<RNFirebaseFirestore> | null {
    const parent = this.collection.parent;
    if (!parent) return null;
    return new RNFirebaseDocumentReference(this.database, parent);
  }
}

class RNFirebaseDocumentReference
  implements GenericDocumentReference<RNFirebaseFirestore>
{
  private database: RNFirebaseFirestore;
  document: FirebaseFirestoreTypes.DocumentReference;

  constructor(
    database: RNFirebaseFirestore,
    document: FirebaseFirestoreTypes.DocumentReference
  ) {
    this.database = database;
    this.document = document;
  }

  get id(): string {
    return this.document.id;
  }
  get path(): string {
    return this.document.path;
  }
  get parent(): GenericCollectionReference<RNFirebaseFirestore> {
    const parent = this.document.parent;
    return new RNFirebaseCollectionReference(this.database, parent);
  }
  get firestore(): GenericFirestore<RNFirebaseFirestore> {
    return new RNFirebaseFirestore(this.document.firestore);
  }
}

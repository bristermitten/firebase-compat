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

import firebase from "firebase/compat/app";
import { joinPath, sanitiseObject } from "./utils";

export class CompatFirebaseFirestore
  implements GenericFirestore<CompatFirebaseFirestore>
{
  private firestore: firebase.firestore.Firestore;

  constructor(firestore: firebase.firestore.Firestore) {
    this.firestore = firestore;
  }
  onSnapshotQuery(
    query: GenericQuery<CompatFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericQuerySnapshot<CompatFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(query instanceof CompatFirebaseQuery))
      throw new Error("Invalid query: " + query);
    const wrappedOptions = {
      includeMetadataChanges: options.includeMetadataChanges ?? false,
    };
    return query.query.onSnapshot(wrappedOptions, {
      next: (snapshot) => {
        onNext?.(new CompatFirebaseQuerySnapshot(this, snapshot));
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
    documentReference: GenericDocumentReference<CompatFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericDocumentSnapshot<CompatFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(documentReference instanceof CompatFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    const wrappedOptions = {
      includeMetadataChanges: options.includeMetadataChanges ?? false,
    };
    return documentReference.document.onSnapshot(wrappedOptions, {
      next: (snapshot) => {
        onNext?.(new CompatFirebaseDocumentSnapshot(this, snapshot));
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
    documentReference: GenericDocumentReference<CompatFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<void> {
    if (!(documentReference instanceof CompatFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return documentReference.document.set(data);
  }

  async getDoc(
    documentReference: GenericDocumentReference<CompatFirebaseFirestore>
  ): Promise<GenericDocumentSnapshot<CompatFirebaseFirestore>> {
    if (!(documentReference instanceof CompatFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    const doc = await documentReference.document.get();
    return new CompatFirebaseDocumentSnapshot(this, doc);
  }
  query(
    query: GenericQueryLike<CompatFirebaseFirestore>,
    ...queryConstraints: GenericQueryConstraint[]
  ): GenericQueryLike<CompatFirebaseFirestore> {
    const ref = query.handle as firebase.firestore.Query;

    let gq: GenericQuery<CompatFirebaseFirestore> = new CompatFirebaseQuery(
      this,
      ref
    );

    for (const constraint of queryConstraints) {
      gq = constraint.apply(gq);
    }

    return gq;
  }
  deleteDoc(
    documentReference: GenericDocumentReference<CompatFirebaseFirestore>
  ): Promise<void> {
    if (!(documentReference instanceof CompatFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return documentReference.document.delete();
  }
  async getDocs(
    collectionReference: GenericCollectionReference<CompatFirebaseFirestore>
  ): Promise<GenericQuerySnapshot<CompatFirebaseFirestore>> {
    const query = collectionReference.handle as firebase.firestore.Query;
    const docs = await query.get();
    return new CompatFirebaseQuerySnapshot(this, docs);
  }
  doc(
    path: string,
    ...pathSegments: string[]
  ): GenericDocumentReference<CompatFirebaseFirestore> {
    const document = this.firestore.doc(joinPath(path, ...pathSegments));
    return new CompatFirebaseDocumentReference(this, document);
  }

  collection(
    path: string,
    ...pathSegments: string[]
  ): GenericCollectionReference<CompatFirebaseFirestore> {
    const col = this.firestore.collection(joinPath(path, ...pathSegments));

    return new CompatFirebaseCollectionReference(this, col);
  }

  async addDoc(
    collectionReference: GenericCollectionReference<CompatFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<GenericDocumentReference<CompatFirebaseFirestore>> {
    if (!(collectionReference instanceof CompatFirebaseCollectionReference))
      throw new Error("Invalid collection reference: " + collectionReference);
    const doc = await collectionReference.collection.add(data);
    return new CompatFirebaseDocumentReference(this, doc);
  }
}
class CompatFirebaseDocumentSnapshot<KnownToExist = false>
  implements GenericDocumentSnapshot<CompatFirebaseFirestore>
{
  database: CompatFirebaseFirestore;
  snapshot: KnownToExist extends true
    ? firebase.firestore.QueryDocumentSnapshot
    : firebase.firestore.DocumentSnapshot;

  constructor(
    database: CompatFirebaseFirestore,
    snapshot: KnownToExist extends true
      ? firebase.firestore.QueryDocumentSnapshot
      : firebase.firestore.DocumentSnapshot
  ) {
    this.database = database;
    this.snapshot = snapshot;
  }
  exists(): this is GenericQueryDocumentSnapshot<CompatFirebaseFirestore> {
    return this.snapshot.exists;
  }
  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  data(): GenericDocumentData | undefined {
    const data = this.snapshot.data();
    if (!data) return undefined;
    return new CompatFirebaseDocumentData(data);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<CompatFirebaseFirestore> {
    return new CompatFirebaseDocumentReference(
      this.database,
      this.snapshot.ref
    );
  }
}

class CompatFirebaseQueryDocumentSnapshot
  extends CompatFirebaseDocumentSnapshot<true>
  implements GenericQueryDocumentSnapshot<CompatFirebaseFirestore>
{
  constructor(
    database: CompatFirebaseFirestore,
    snapshot: firebase.firestore.QueryDocumentSnapshot
  ) {
    super(database, snapshot);
  }
  exists(): this is GenericQueryDocumentSnapshot<CompatFirebaseFirestore> {
    return true;
  }

  data(): GenericDocumentData {
    const data = this.snapshot.data();
    return new CompatFirebaseDocumentData(data);
  }

  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<CompatFirebaseFirestore> {
    return new CompatFirebaseDocumentReference(
      this.database,
      this.snapshot.ref
    );
  }
}

class CompatFirebaseQuery extends GenericQuery<CompatFirebaseFirestore> {
  get handle(): unknown {
    return this.query;
  }
  query: firebase.firestore.Query;
  database: CompatFirebaseFirestore;

  constructor(
    database: CompatFirebaseFirestore,
    query: firebase.firestore.Query
  ) {
    super();
    this.database = database;
    this.query = query;
  }

  orderBy(
    fieldPath: string,
    directionStr?: OrderByDirection | undefined
  ): GenericQuery<CompatFirebaseFirestore> {
    return new CompatFirebaseQuery(
      this.database,
      this.query.orderBy(fieldPath, directionStr)
    );
  }
  limit(limit: number): GenericQuery<CompatFirebaseFirestore> {
    return new CompatFirebaseQuery(this.database, this.query.limit(limit));
  }
  where(
    fieldPath: string,
    opStr: WhereFilterOp,
    value: unknown
  ): GenericQuery<CompatFirebaseFirestore> {
    return new CompatFirebaseQuery(
      this.database,
      this.query.where(fieldPath, opStr, value)
    );
  }
}
class CompatFirebaseQuerySnapshot extends GenericQuerySnapshot<CompatFirebaseFirestore> {
  private database: CompatFirebaseFirestore;
  private snapshot: firebase.firestore.QuerySnapshot;

  constructor(
    database: CompatFirebaseFirestore,
    snapshot: firebase.firestore.QuerySnapshot
  ) {
    super();
    this.database = database;
    this.snapshot = snapshot;
  }
  get docs(): GenericQueryDocumentSnapshot<CompatFirebaseFirestore>[] {
    return this.snapshot.docs.map(
      (doc) => new CompatFirebaseQueryDocumentSnapshot(this.database, doc)
    );
  }
  get size(): number {
    return this.snapshot.size;
  }
  get empty(): boolean {
    return this.snapshot.empty;
  }
}

class CompatFirebaseDocumentData implements GenericDocumentData {
  constructor(data: firebase.firestore.DocumentData) {
    Object.assign(
      this,
      sanitiseObject(data, (_, value) => {
        if (value instanceof firebase.firestore.Timestamp) {
          return value.toDate();
        }
        return value;
      })
    );
  }
  [field: string]: unknown;
}

class CompatFirebaseCollectionReference extends GenericCollectionReference<CompatFirebaseFirestore> {
  collection: firebase.firestore.CollectionReference;
  firestore: CompatFirebaseFirestore;

  get handle(): unknown {
    return this.collection;
  }

  constructor(
    firestore: CompatFirebaseFirestore,
    collection: firebase.firestore.CollectionReference
  ) {
    super();
    this.firestore = firestore;
    this.collection = collection;
  }

  get database(): CompatFirebaseFirestore {
    return this.firestore;
  }

  get id(): string {
    return this.collection.id;
  }
  get path(): string {
    return this.collection.path;
  }
  get parent(): GenericDocumentReference<CompatFirebaseFirestore> | null {
    const parent = this.collection.parent;
    if (!parent) return null;
    return new CompatFirebaseDocumentReference(this.database, parent);
  }
}

class CompatFirebaseDocumentReference
  implements GenericDocumentReference<CompatFirebaseFirestore>
{
  private database: CompatFirebaseFirestore;
  document: firebase.firestore.DocumentReference;

  constructor(
    database: CompatFirebaseFirestore,
    document: firebase.firestore.DocumentReference
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
  get parent(): GenericCollectionReference<CompatFirebaseFirestore> {
    const parent = this.document.parent;
    return new CompatFirebaseCollectionReference(this.database, parent);
  }
  get firestore(): GenericFirestore<CompatFirebaseFirestore> {
    return new CompatFirebaseFirestore(this.document.firestore);
  }
}

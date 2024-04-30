import {
  GenericCollectionReference,
  GenericDocumentData,
  GenericDocumentReference,
  GenericFirestore,
  GenericQueryLike,
  GenericQueryConstraint,
  GenericQueryDocumentSnapshot,
  GenericQuerySnapshot,
  WhereFilterOp,
  GenericQuery,
  GenericDocumentSnapshot,
  OrderByDirection,
  SnapshotListenOptions,
  UnsubscribeFirestore,
} from "./firestore";
import {
  CollectionReference,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  Firestore,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  QuerySnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { sanitiseObject } from "./utils";

export class ModularFirebaseFirestore
  implements GenericFirestore<ModularFirebaseFirestore>
{
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }
  onSnapshotQuery(
    query: GenericQuery<ModularFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericQuerySnapshot<ModularFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(query instanceof ModularFirebaseQuery))
      throw new Error("Invalid query: " + query);
    return onSnapshot(
      query.query,
      options,
      onNext ? (qs) => onNext(new ModularFirebaseQuerySnapshot(qs)) : () => {},
      onError,
      onCompletion
    );
  }
  onSnapshot(
    documentReference: GenericDocumentReference<ModularFirebaseFirestore>,
    options: SnapshotListenOptions,
    onNext:
      | ((snapshot: GenericDocumentSnapshot<ModularFirebaseFirestore>) => void)
      | undefined,
    onError: ((error: Error) => void) | undefined,
    onCompletion: (() => void) | undefined
  ): UnsubscribeFirestore {
    if (!(documentReference instanceof ModularFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);

    return onSnapshot(
      documentReference.document,
      options,
      onNext
        ? (qs) => onNext(new ModularFirebaseDocumentSnapshot(qs))
        : () => {},
      onError,
      onCompletion
    );
  }
  setDoc(
    documentReference: GenericDocumentReference<ModularFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<void> {
    if (!(documentReference instanceof ModularFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return setDoc(documentReference.document, data);
  }

  query(
    queryObj: GenericQueryLike<ModularFirebaseFirestore>,
    ...queryConstraints: GenericQueryConstraint[]
  ): GenericQueryLike<ModularFirebaseFirestore> {
    const ref = queryObj.handle as Query<DocumentData, DocumentData>;

    let gq: GenericQuery<ModularFirebaseFirestore> = new ModularFirebaseQuery(
      this,
      ref
    );

    for (const constraint of queryConstraints) {
      gq = constraint.apply(gq);
    }

    return gq;
  }

  deleteDoc(
    documentReference: GenericDocumentReference<ModularFirebaseFirestore>
  ): Promise<void> {
    if (!(documentReference instanceof ModularFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    return deleteDoc(documentReference.document);
  }

  async getDocs(
    collectionReference: GenericQueryLike<ModularFirebaseFirestore>
  ): Promise<GenericQuerySnapshot<ModularFirebaseFirestore>> {
    const ref = collectionReference.handle as Query<DocumentData, DocumentData>;
    const docs = await getDocs(ref);
    return new ModularFirebaseQuerySnapshot(docs);
  }

  doc(
    path: string,
    ...pathSegments: string[]
  ): GenericDocumentReference<ModularFirebaseFirestore> {
    const document = doc(this.firestore, path, ...pathSegments);
    return new ModularFirebaseDocumentReference(document);
  }

  collection(
    path: string,
    ...pathSegments: string[]
  ): GenericCollectionReference<ModularFirebaseFirestore> {
    const col = collection(this.firestore, path, ...pathSegments);
    return new ModularFirebaseCollectionReference(col);
  }

  async addDoc(
    collectionReference: GenericCollectionReference<ModularFirebaseFirestore>,
    data: GenericDocumentData
  ): Promise<GenericDocumentReference<ModularFirebaseFirestore>> {
    if (!(collectionReference instanceof ModularFirebaseCollectionReference))
      throw new Error("Invalid collection reference: " + collectionReference);
    const doc = await addDoc(collectionReference.collection, data);
    return new ModularFirebaseDocumentReference(doc);
  }

  async getDoc(
    documentReference: GenericDocumentReference<ModularFirebaseFirestore>
  ): Promise<GenericDocumentSnapshot<ModularFirebaseFirestore>> {
    if (!(documentReference instanceof ModularFirebaseDocumentReference))
      throw new Error("Invalid document reference: " + documentReference);
    const doc = await getDoc(documentReference.document);
    return new ModularFirebaseDocumentSnapshot(doc);
  }
}

class ModularFirebaseDocumentSnapshot<KnownToExist = false>
  implements GenericDocumentSnapshot<ModularFirebaseFirestore>
{
  snapshot: KnownToExist extends true
    ? QueryDocumentSnapshot<DocumentData>
    : DocumentSnapshot<DocumentData>;

  constructor(
    snapshot: KnownToExist extends true
      ? QueryDocumentSnapshot<DocumentData>
      : DocumentSnapshot<DocumentData>
  ) {
    this.snapshot = snapshot;
  }
  exists(): this is GenericQueryDocumentSnapshot<ModularFirebaseFirestore> {
    return this.snapshot.exists();
  }
  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  data(): GenericDocumentData | undefined {
    const data = this.snapshot.data();
    if (!data) return undefined;
    return new ModularFirebaseDocumentData(data);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<ModularFirebaseFirestore> {
    return new ModularFirebaseDocumentReference(this.snapshot.ref);
  }
}

class ModularFirebaseQuery extends GenericQuery<ModularFirebaseFirestore> {
  get handle(): unknown {
    return this.query;
  }
  query: Query<DocumentData>;
  database: ModularFirebaseFirestore;

  constructor(database: ModularFirebaseFirestore, query: Query<DocumentData>) {
    super();
    this.database = database;
    this.query = query;
  }

  where(
    fieldPath: string,
    opStr: WhereFilterOp,
    value: unknown
  ): GenericQuery<ModularFirebaseFirestore> {
    return new ModularFirebaseQuery(
      this.database,
      query(this.query, where(fieldPath, opStr, value))
    );
  }

  orderBy(
    fieldPath: string,
    directionStr?: OrderByDirection | undefined
  ): GenericQuery<ModularFirebaseFirestore> {
    return new ModularFirebaseQuery(
      this.database,
      query(this.query, orderBy(fieldPath, directionStr))
    );
  }

  limit(limitNum: number): GenericQuery<ModularFirebaseFirestore> {
    return new ModularFirebaseQuery(
      this.database,
      query(this.query, limit(limitNum))
    );
  }
}

class ModularFirebaseQuerySnapshot extends GenericQuerySnapshot<ModularFirebaseFirestore> {
  private snapshot: QuerySnapshot<DocumentData, DocumentData>;

  constructor(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
    super();
    this.snapshot = snapshot;
  }

  get docs(): GenericQueryDocumentSnapshot<ModularFirebaseFirestore>[] {
    return this.snapshot.docs.map(
      (doc) => new ModularFirebaseQueryDocumentSnapshot(doc)
    );
  }
  get size(): number {
    return this.snapshot.size;
  }
  get empty(): boolean {
    return this.snapshot.empty;
  }
}

class ModularFirebaseQueryDocumentSnapshot
  extends ModularFirebaseDocumentSnapshot<true>
  implements GenericQueryDocumentSnapshot<ModularFirebaseFirestore>
{
  constructor(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>) {
    super(snapshot);
  }
  exists(): this is GenericQueryDocumentSnapshot<ModularFirebaseFirestore> {
    return true;
  }

  data(): GenericDocumentData {
    const data = this.snapshot.data();
    return new ModularFirebaseDocumentData(data);
  }

  get(fieldPath: string) {
    return this.snapshot.get(fieldPath);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get ref(): GenericDocumentReference<ModularFirebaseFirestore> {
    return new ModularFirebaseDocumentReference(this.snapshot.ref);
  }
}

class ModularFirebaseDocumentData implements GenericDocumentData {
  constructor(data: DocumentData) {
    Object.assign(
      this,
      sanitiseObject(data, (field, value) => {
        if (value instanceof Timestamp) {
          return value.toDate();
        }
        return value;
      })
    );
  }
  [field: string]: unknown;
}

class ModularFirebaseCollectionReference extends GenericCollectionReference<ModularFirebaseFirestore> {
  get handle(): unknown {
    return this.collection;
  }
  collection: CollectionReference<DocumentData, DocumentData>;

  constructor(collection: CollectionReference<DocumentData, DocumentData>) {
    super();
    this.collection = collection;
  }

  get database(): ModularFirebaseFirestore {
    return new ModularFirebaseFirestore(this.collection.firestore);
  }

  get id(): string {
    return this.collection.id;
  }
  get path(): string {
    return this.collection.path;
  }
  get parent(): GenericDocumentReference<ModularFirebaseFirestore> | null {
    const parent = this.collection.parent;
    if (!parent) return null;
    return new ModularFirebaseDocumentReference(parent);
  }
}

class ModularFirebaseDocumentReference
  implements GenericDocumentReference<ModularFirebaseFirestore>
{
  document: DocumentReference<DocumentData>;

  constructor(document: DocumentReference<DocumentData>) {
    this.document = document;
  }

  get id(): string {
    return this.document.id;
  }
  get path(): string {
    return this.document.path;
  }
  get parent(): GenericCollectionReference<ModularFirebaseFirestore> {
    const parent = this.document.parent;
    return new ModularFirebaseCollectionReference(parent);
  }
  get firestore(): ModularFirebaseFirestore {
    return new ModularFirebaseFirestore(this.document.firestore);
  }
}

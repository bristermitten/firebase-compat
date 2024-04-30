import { ModularFirebaseFirestore } from "./firestore.modular";
import { deleteApp, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import {
  GenericFirestore,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "./firestore";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { CompatFirebaseFirestore } from "./firestore.compat";
import "firebase/compat/auth";
import "firebase/compat/firestore";

async function roundTripTest<DB extends GenericFirestore<DB>>(
  db: GenericFirestore<DB>
) {
  const col = collection(db, "test", "a", "b");
  expect(col).toBeTruthy();
  expect(col.id).toEqual("b");
  expect(col.path).toEqual("test/a/b");
  expect(col.parent?.id).toEqual("a");
  expect(col.parent?.id).toEqual(doc(db, "test", "a").id);
  expect(col.parent?.parent?.id).toEqual("test");

  let docs = await getDocs(col);
  expect(docs).toBeTruthy();
  expect(docs.empty).toBeTruthy();
  expect(docs.size).toEqual(0);
  expect(docs.docs).toHaveLength(0);

  const now = new Date();

  const testDoc = await addDoc(col, { test: "test", timeCreated: now });
  expect(testDoc).toBeTruthy();
  expect(testDoc.id).toBeTruthy();
  expect(testDoc.path).toBeTruthy();

  docs = await getDocs(query(col, where("test", "!=", "test"))); // Should be empty
  expect(docs).toBeTruthy();
  expect(docs.empty).toBeTruthy();
  expect(docs.size).toEqual(0);
  expect(docs.docs).toHaveLength(0);

  docs = await getDocs(col);
  expect(docs).toBeTruthy();
  expect(docs.empty).toBeFalsy();
  expect(docs.size).toEqual(1);
  expect(docs.docs).toHaveLength(1);
  expect(docs.docs[0].exists()).toBeTruthy();
  expect(docs.docs[0].get("test")).toEqual("test");
  expect(docs.docs[0].id).toEqual(testDoc.id);
  expect(docs.docs[0].data()).toEqual({ test: "test", timeCreated: now });

  await deleteDoc(docs.docs[0].ref);
  docs = await getDocs(col);
  expect(docs).toBeTruthy();
  expect(docs.docs).toHaveLength(0);

  const next = jest.fn();
  const error = jest.fn();
  const complete = jest.fn();
  const unsubscribe = onSnapshot(testDoc, {}, { next, error, complete });
  expect(next).toHaveBeenCalledTimes(0);
  expect(error).toHaveBeenCalledTimes(0);
  expect(complete).toHaveBeenCalledTimes(0);
  await setDoc(testDoc, { test: "test2", timeCreated: new Date() });
  expect(next).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledTimes(0);
  expect(complete).toHaveBeenCalledTimes(0);
  unsubscribe()
  await setDoc(testDoc, { test: "test3", timeCreated: new Date() });
  expect(next).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledTimes(0);
  expect(complete).toHaveBeenCalledTimes(0);
}

test("Test it with the main firebase API", async () => {
  const firebaseConfig = {
    projectId: "ubuc-inventory-system",
  };

  const app = initializeApp(firebaseConfig);
  connectFirestoreEmulator(getFirestore(app), "localhost", 8080);
  const dbInstance = getFirestore();

  const db = new ModularFirebaseFirestore(dbInstance);

  await roundTripTest(db);

  await deleteApp(app);
});

test("Test it with the unit-testing compat API", async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-ubuc-inventory-system",
  });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = new CompatFirebaseFirestore(ctx.firestore());

    await roundTripTest(db);
  });
  await testEnv.cleanup();
});

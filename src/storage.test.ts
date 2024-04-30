import { deleteApp, initializeApp } from "firebase/app";
import { GenericStorage, getBytes, uploadBytes } from "./storage";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { ModularFirebaseStorage } from "./storage.modular";
import { ref } from "./storage";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import firebase from "firebase/compat/app";
import { CompatFirebaseStorage } from "./storage.compat";

const firebaseProjectId = "demo-ubuc-inventory-system";

async function roundTripTest<Storage extends GenericStorage<Storage>>(
  db: Storage,
) {
  const dbRef = ref(db, "image.png");
  expect(dbRef).toBeTruthy();
  expect(dbRef.fullPath).toEqual("image.png");
  expect(dbRef.name).toEqual("image.png");
  expect(dbRef.bucket).toEqual("test");
  expect(dbRef.parent).toBeTruthy();
  expect(dbRef.toString()).toEqual("gs://test/image.png");

  expect(dbRef.root.fullPath).toEqual("");
  expect(dbRef.root.parent).toBeFalsy();

  const refChild = ref(dbRef, "child.png");
  expect(refChild).toBeTruthy();
  expect(refChild.fullPath).toEqual("image.png/child.png");
  expect(refChild.bucket).toEqual("test");
  expect(refChild.parent?.fullPath).toEqual("image.png");

  const uploadResult = await uploadBytes(dbRef, new Uint8Array([1, 2, 3]));
  expect(uploadResult).toBeTruthy();
  expect(uploadResult.ref).toBeTruthy();
  expect(uploadResult.metadata.md5Hash).toEqual("Uonfc331cyb83SJZevsfrA==");
  expect(uploadResult.metadata.name).toEqual("image.png");
  expect(uploadResult.metadata.size).toEqual(3);

  const downloadUrl = await db.getDownloadURL(dbRef);
  expect(downloadUrl).toBeTruthy();
  expect(downloadUrl).toContain(
    `http://localhost:9199/v0/b/test/o/image.png?alt=media`,
  );

  const content = await getBytes(dbRef);
  expect(content).toBeTruthy();
  expect(content.byteLength).toEqual(3);

  expect(content.slice).toBeTruthy();
  const data = new Uint8Array(content);
  expect(data).toBeTruthy();
  expect(new Uint8Array(data)).toEqual(new Uint8Array([1, 2, 3]));
}

test("Test it with the main firebase API", async () => {
  const firebaseConfig = {
    projectId: firebaseProjectId,
    apiKey: "any",
    storageBucket: "test",
  };

  const app = initializeApp(firebaseConfig);
  connectStorageEmulator(getStorage(app), "localhost", 9199);
  const authInstance = getStorage();

  const db = new ModularFirebaseStorage(authInstance);

  await roundTripTest(db);
  await deleteApp(app);
});

test("Test it with the unit-testing compat API", async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: firebaseProjectId,
  });

  const firebaseConfig = {
    projectId: firebaseProjectId,
    apiKey: "any",
    storageBucket: "test",
  };

  const app = firebase.initializeApp(firebaseConfig);
  const storage = firebase.storage();
  storage.useEmulator("localhost", 9199);

  await testEnv.withSecurityRulesDisabled(async () => {
    const db = new CompatFirebaseStorage(storage);
    await roundTripTest(db);
  });

  await deleteApp(app);
  await testEnv.cleanup();
});

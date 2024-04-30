import { ModularFirebaseAuth } from "./auth.modular";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import "firebase/compat/auth";
import firebase from "firebase/compat/app";
import { GenericAuth, reauthenticateWithCredential } from "./auth";
import { CompatFirebaseAuth } from "./auth.compat";

const authEmulatorPort = 9099;
const firebaseProjectId = "demo-ubuc-inventory-system";

async function clearAuth() {
  const res = await fetch(
    `http://localhost:${authEmulatorPort}/emulator/v1/projects/${firebaseProjectId}/accounts`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer owner",
      },
    }
  );

  if (res.status !== 200)
    throw new Error("Unable to reset Authentication Emulators");
}

beforeEach(async () => {
  await clearAuth();
});

async function roundTripTest<DB extends GenericAuth<DB>>(db: GenericAuth<DB>) {
  const cred = await db.createUserWithEmailAndPassword(
    "email@email.com",
    "password123"
  );
  expect(cred).toBeTruthy();
  expect(cred.user).toBeTruthy();
  expect(cred.user.email).toBeTruthy();
  expect(cred.user.email).toEqual("email@email.com");
  expect(cred.user.uid).toBeTruthy();

  const user = db.currentUser;
  expect(user).toBeTruthy();
  expect(user?.email).toBeTruthy();
  expect(user?.email).toEqual(cred.user.email);
  expect(user?.uid).toBeTruthy();

  await db.signOut();

  expect(db.currentUser).toBeFalsy();

  const cred2 = await db.signInWithEmailAndPassword(
    cred.user.email!,
    "password123"
  );
  expect(cred2).toBeTruthy();
  expect(cred2.user).toBeTruthy();
  expect(cred2.user.email).toBeTruthy();
  expect(cred2.user.email).toEqual(cred.user.email);
  expect(cred2.user.uid).toBeTruthy();

  await db.signOut();

  await expect(
    db.signInWithEmailAndPassword(cred.user.email!, "invalidpassword")
  ).rejects.toThrow(/(auth\/wrong-password)/);
  expect(db.currentUser).toBeFalsy();

  const ap = db.newEmailAuthProvider();
  const cred3 = await ap.credential({
    email: "email@email.com",
    password: "password123",
  });
  expect(cred3).toBeTruthy();
  const newCred = await reauthenticateWithCredential(user!, cred3);
  expect(newCred).toBeTruthy();
  expect(newCred.user).toBeTruthy();
  expect(newCred.user.email).toBeTruthy();
  expect(newCred.user.email).toEqual(cred.user.email);
  expect(newCred.user.uid).toBeTruthy();
}

test("Test it with the main firebase API", async () => {
  const firebaseConfig = {
    projectId: firebaseProjectId,
    apiKey: "any",
  };

  const app = initializeApp(firebaseConfig);
  connectAuthEmulator(getAuth(app), "http://localhost:9099");
  const authInstance = getAuth();

  const db = new ModularFirebaseAuth(authInstance);

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
  };

  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  auth.useEmulator("http://127.0.0.1:9099");

  await testEnv.withSecurityRulesDisabled(async () => {
    const db = new CompatFirebaseAuth(auth);
    await roundTripTest(db);
  });

  await deleteApp(app);
  await testEnv.cleanup();
});

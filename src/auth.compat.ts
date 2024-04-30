import { GenericAuth, Persistence, GenericUser } from "./auth";
import {
  GenericAuthProvider,
  CustomParameters,
  GenericUserCredential,
  NextOrObserver,
  OAuthCredential,
  OAuthCredentialOptions,
  GenericOAuthProvider,
  OperationType,
  Unsubscribe,
  UserCredential,
  ProfileType,
  ActionCodeSettings,
  EmailAuthParamType,
  GenericAuthCredential,
} from "./auth.types";

import firebase from "firebase/compat/app";
export class CompatFirebaseAuth implements GenericAuth<CompatFirebaseAuth> {
  private auth: firebase.auth.Auth;

  constructor(auth: firebase.auth.Auth) {
    this.auth = auth;
  }
  newEmailAuthProvider(): GenericAuthProvider<
    CompatFirebaseAuth,
    EmailAuthParamType
  > {
    return new CompatEmailAuthProvider();
  }
  newOAuthProvider(
    providerId: string,
  ): GenericOAuthProvider<CompatFirebaseAuth> {
    return new CompatOAuthProvider(providerId);
  }
  async signInWithPopup(
    provider: GenericAuthProvider<CompatFirebaseAuth, OAuthCredentialOptions>,
  ): Promise<UserCredential<CompatFirebaseAuth>> {
    const cred = await this.auth.signInWithPopup(provider);
    if (!cred.user) {
      throw new Error("No user returned from signInWithPopup");
    }
    return {
      user: new CompatFirebaseUser(cred.user!),
      providerId: cred.additionalUserInfo?.providerId ?? null,
      operationType:
        (cred.operationType as (typeof OperationType)[keyof typeof OperationType]) ??
        "signIn",
    };
  }
  async signInWithRedirect(
    provider: GenericAuthProvider<CompatFirebaseAuth, OAuthCredentialOptions>,
  ): Promise<UserCredential<CompatFirebaseAuth>> {
    await this.auth.signInWithRedirect(provider);
    const cred = await this.auth.getRedirectResult();
    if (!cred.user) {
      throw new Error("No user returned from signInWithPopup");
    }
    return {
      user: new CompatFirebaseUser(cred.user!),
      providerId: cred.additionalUserInfo?.providerId ?? null,
      operationType:
        (cred.operationType as (typeof OperationType)[keyof typeof OperationType]) ??
        "signIn",
    };
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }

  get currentUser(): GenericUser<CompatFirebaseAuth> | null {
    const user = this.auth.currentUser;
    return user == null ? null : new CompatFirebaseUser(user);
  }
  async createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<CompatFirebaseAuth>> {
    const cred = await this.auth.createUserWithEmailAndPassword(
      email,
      password,
    );

    if (!cred.user)
      throw new Error("No user returned from createUserWithEmailAndPassword");
    const wrappedCred: GenericUserCredential<CompatFirebaseAuth> = {
      user: new CompatFirebaseUser(cred.user),
      providerId: cred?.additionalUserInfo?.providerId ?? null,
      operationType: "signIn",
    };
    return wrappedCred;
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<CompatFirebaseAuth>> {
    const cred = await this.auth.signInWithEmailAndPassword(email, password);

    if (!cred.user)
      throw new Error("No user returned from signInWithEmailAndPassword");

    const wrappedCred: GenericUserCredential<CompatFirebaseAuth> = {
      user: new CompatFirebaseUser(cred.user),
      providerId: cred?.additionalUserInfo?.providerId ?? null,
      operationType: "signIn",
    };
    return wrappedCred;
  }

  onAuthStateChanged(
    nextOrObserver: NextOrObserver<GenericUser<CompatFirebaseAuth> | null>,
  ): Unsubscribe {
    const observerCall =
      typeof nextOrObserver === "function"
        ? nextOrObserver
        : nextOrObserver.next;
    return this.auth.onAuthStateChanged((user) =>
      user == null
        ? observerCall(null)
        : observerCall(new CompatFirebaseUser(user)),
    );
  }

  async setPersistence(persistence: Persistence): Promise<void> {
    return this.auth.setPersistence(persistence);
  }

  applyActionCode(oobCode: string): Promise<void> {
    return this.auth.applyActionCode(oobCode);
  }

  sendPasswordResetEmail(
    email: string,
    actionCodeSettings?: ActionCodeSettings | undefined,
  ): Promise<void> {
    return this.auth.sendPasswordResetEmail(email, actionCodeSettings);
  }
}

export class CompatFirebaseUser implements GenericUser<CompatFirebaseAuth> {
  private user: firebase.User;

  constructor(user: firebase.User) {
    this.user = user;
  }
  async reauthenticateWithCredential(
    credential: GenericAuthCredential<CompatFirebaseAuth>,
  ): Promise<UserCredential<CompatFirebaseAuth>> {
    if (!(credential instanceof CompatAuthCredential))
      throw new Error("Credential must be CompatAuthCredential");
    const cred = await this.user.reauthenticateWithCredential(
      credential.handle,
    );
    if (!cred.user) {
      throw new Error("No user returned from reauthenticateWithCredential");
    }
    return {
      user: new CompatFirebaseUser(cred.user),
      providerId: cred.additionalUserInfo?.providerId ?? null,
      operationType: "reauthenticate",
    };
  }
  sendEmailVerification(
    actionCodeSettings?: ActionCodeSettings | null | undefined,
  ): Promise<void> {
    return this.user.sendEmailVerification(actionCodeSettings);
  }
  updateEmail(newEmail: string): Promise<void> {
    return this.user.updateEmail(newEmail);
  }
  updateProfile(profile: ProfileType): Promise<void> {
    return this.user.updateProfile(profile);
  }

  updatePassword(newPassword: string): Promise<void> {
    return this.user.updatePassword(newPassword);
  }

  get email(): string | null {
    return this.user.email;
  }

  get displayName(): string | null {
    return this.user.displayName;
  }

  get phoneNumber(): string | null {
    return this.user.phoneNumber;
  }

  get photoURL(): string | null {
    return this.user.photoURL;
  }

  get providerId(): string {
    return this.user.providerId;
  }

  get uid(): string {
    return this.user.uid;
  }

  get emailVerified(): boolean {
    return this.user.emailVerified;
  }
  get isAnonymous(): boolean {
    return this.user.isAnonymous;
  }

  delete(): Promise<void> {
    return this.user.delete();
  }
  getIdToken(forceRefresh?: boolean | undefined): Promise<string> {
    return this.user.getIdToken(forceRefresh);
  }
  reload(): Promise<void> {
    return this.user.reload();
  }
  toJSON(): object {
    return this.user.toJSON();
  }
}

export class CompatOAuthProvider
  implements GenericOAuthProvider<CompatFirebaseAuth>
{
  handle: firebase.auth.OAuthProvider;
  providerId: string;
  constructor(providerId: string) {
    this.providerId = providerId;
    this.handle = new firebase.auth.OAuthProvider(providerId);
  }
  async credential(
    params: OAuthCredentialOptions,
  ): Promise<OAuthCredential<CompatFirebaseAuth>> {
    const ap = this.handle.credential(params);
    return new CompatAuthCredential(ap);
  }
  addScope(
    scope: string,
  ): GenericAuthProvider<CompatFirebaseAuth, OAuthCredentialOptions> {
    const ap = this.handle.addScope(scope);
    this.handle = ap as firebase.auth.OAuthProvider;
    return this;
  }

  setCustomParameters(
    customOAuthParameters: CustomParameters,
  ): GenericAuthProvider<CompatFirebaseAuth, OAuthCredentialOptions> {
    const ap = this.handle.setCustomParameters(customOAuthParameters);
    this.handle = ap as firebase.auth.OAuthProvider;
    return this;
  }
}

class CompatEmailAuthProvider
  implements GenericAuthProvider<CompatFirebaseAuth, EmailAuthParamType>
{
  get providerId(): string {
    return firebase.auth.EmailAuthProvider.PROVIDER_ID;
  }
  async credential(
    param: EmailAuthParamType,
  ): Promise<GenericAuthCredential<CompatFirebaseAuth>> {
    return new CompatAuthCredential(
      firebase.auth.EmailAuthProvider.credential(param.email, param.password),
    );
  }
}

export class CompatAuthCredential
  implements GenericAuthCredential<CompatFirebaseAuth>
{
  handle: firebase.auth.AuthCredential;

  constructor(handle: firebase.auth.AuthCredential) {
    this.handle = handle;
  }

  get providerId(): string {
    return this.handle.providerId;
  }
}

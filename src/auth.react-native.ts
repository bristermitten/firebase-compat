import {
  ActionCodeSettings,
  GenericAuthProvider,
  CustomParameters,
  GenericOAuthProvider,
  GenericUserCredential,
  NextOrObserver,
  OAuthCredential,
  OAuthCredentialOptions,
  ProfileType,
  Unsubscribe,
  UserCredential,
  EmailAuthParamType,
  GenericAuthCredential,
} from "./auth.types";
import { GenericAuth, GenericUser } from "./auth";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export class RNFirebaseAuth implements GenericAuth<RNFirebaseAuth> {
  private auth: FirebaseAuthTypes.Module;

  constructor(auth: FirebaseAuthTypes.Module) {
    this.auth = auth;
  }
  newEmailAuthProvider(): GenericAuthProvider<
    RNFirebaseAuth,
    EmailAuthParamType
  > {
    return new RNEmailAuthProvider();
  }
  newOAuthProvider(providerId: string): GenericOAuthProvider<RNFirebaseAuth> {
    return new RNOAuthProvider(providerId);
  }
  async signInWithPopup(
    provider: GenericAuthProvider<RNFirebaseAuth, OAuthCredentialOptions>
  ): Promise<UserCredential<RNFirebaseAuth>> {
    const oauth = await import("@react-native-firebase/auth").then(
      (auth) => new auth.default.OAuthProvider(provider.providerId)
    );
    const cred = await this.auth.signInWithPopup(oauth);
    return {
      user: new RNFirebaseUser(cred.user),
      providerId: cred.additionalUserInfo?.providerId ?? provider.providerId,
      operationType: "signIn",
    };
  }
  async signInWithRedirect(
    provider: GenericAuthProvider<RNFirebaseAuth, OAuthCredentialOptions>
  ): Promise<UserCredential<RNFirebaseAuth>> {
    const oauth = await import("@react-native-firebase/auth").then(
      (auth) => new auth.default.OAuthProvider(provider.providerId)
    );
    const cred = await this.auth.signInWithRedirect(oauth);
    return {
      user: new RNFirebaseUser(cred.user),
      providerId: cred.additionalUserInfo?.providerId ?? provider.providerId,
      operationType: "signIn",
    };
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }

  get currentUser(): GenericUser<RNFirebaseAuth> | null {
    const user = this.auth.currentUser;
    return user == null ? null : new RNFirebaseUser(user);
  }

  async createUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<GenericUserCredential<RNFirebaseAuth>> {
    const cred = await this.auth.createUserWithEmailAndPassword(
      email,
      password
    );

    const wrappedCred: GenericUserCredential<RNFirebaseAuth> = {
      user: new RNFirebaseUser(cred.user),
      providerId: null,
      operationType: "signIn",
    };
    return wrappedCred;
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<GenericUserCredential<RNFirebaseAuth>> {
    const cred = await this.auth.signInWithEmailAndPassword(email, password);

    const wrappedCred: GenericUserCredential<RNFirebaseAuth> = {
      user: new RNFirebaseUser(cred.user),
      providerId: cred.additionalUserInfo?.providerId ?? null,
      operationType: "signIn",
    };
    return wrappedCred;
  }

  onAuthStateChanged(
    nextOrObserver: NextOrObserver<GenericUser<RNFirebaseAuth> | null>
  ): Unsubscribe {
    const observerCall =
      typeof nextOrObserver === "function"
        ? nextOrObserver
        : nextOrObserver.next;
    return this.auth.onAuthStateChanged((user) =>
      user == null ? observerCall(null) : observerCall(new RNFirebaseUser(user))
    );
  }

  async setPersistence(): Promise<void> {
    // no op in react-native
    return;
  }

  applyActionCode(oobCode: string): Promise<void> {
    return this.auth.applyActionCode(oobCode);
  }

  sendPasswordResetEmail(
    email: string,
    actionCodeSettings?: ActionCodeSettings | undefined
  ): Promise<void> {
    return this.auth.sendPasswordResetEmail(email, actionCodeSettings);
  }
}

export class RNFirebaseUser implements GenericUser<RNFirebaseAuth> {
  private user: FirebaseAuthTypes.User;

  constructor(user: FirebaseAuthTypes.User) {
    this.user = user;
  }
  async reauthenticateWithCredential(
    credential: GenericAuthCredential<RNFirebaseAuth>
  ): Promise<UserCredential<RNFirebaseAuth>> {
    if (!(credential instanceof RNAuthCredential))
      throw new Error("Invalid credential");

    const cred = await this.user.reauthenticateWithCredential(
      credential.handle
    );
    return {
      user: new RNFirebaseUser(cred.user),
      providerId: cred.additionalUserInfo?.providerId ?? null,
      operationType: "reauthenticate",
    };
  }

  updateEmail(newEmail: string): Promise<void> {
    return this.user.updateEmail(newEmail);
  }

  updateProfile(profile: ProfileType): Promise<void> {
    return this.user.updateProfile(profile);
  }

  sendEmailVerification(
    actionCodeSettings?: ActionCodeSettings | null | undefined
  ): Promise<void> {
    return this.user.sendEmailVerification(actionCodeSettings ?? undefined);
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

export class RNAuthCredential implements GenericAuthCredential<RNFirebaseAuth> {
  handle: FirebaseAuthTypes.AuthCredential;

  constructor(handle: FirebaseAuthTypes.AuthCredential) {
    this.handle = handle;
  }

  get providerId(): string {
    return this.handle.providerId;
  }
}

export class RNOAuthProvider implements GenericOAuthProvider<RNFirebaseAuth> {
  private handle!: FirebaseAuthTypes.OAuthProvider;

  addScope(
    scope: string
  ): GenericAuthProvider<RNFirebaseAuth, OAuthCredentialOptions> {
    const ap = this.handle.addScope(scope);
    this.handle = ap as unknown as FirebaseAuthTypes.OAuthProvider;
    return this;
  }

  getScopes(): string[] {
    return this.handle.getScopes();
  }

  providerId: string;
  constructor(providerId: string) {
    this.providerId = providerId;
    import("@react-native-firebase/auth")
      .then((auth) => new auth.default.OAuthProvider(providerId))
      .then(
        (handle) =>
          (this.handle = handle as unknown as FirebaseAuthTypes.OAuthProvider)
      );
  }
  async credential(
    params: OAuthCredentialOptions
  ): Promise<OAuthCredential<RNFirebaseAuth>> {
    return new RNAuthCredential(
      this.handle.credential(params.accessToken ?? null)
    );
  }

  setCustomParameters(
    customOAuthParameters: CustomParameters
  ): GenericAuthProvider<RNFirebaseAuth, OAuthCredentialOptions> {
    const ap = this.handle.setCustomParameters(customOAuthParameters);
    this.handle = ap as unknown as FirebaseAuthTypes.OAuthProvider;
    return this;
  }
}

class RNEmailAuthProvider
  implements GenericAuthProvider<RNFirebaseAuth, EmailAuthParamType>
{
  get providerId(): string {
    return "password";
  }
  async credential(
    param: EmailAuthParamType
  ): Promise<GenericAuthCredential<RNFirebaseAuth>> {
    const auth = await import("@react-native-firebase/auth");
    return new RNAuthCredential(
      auth.default.EmailAuthProvider.credential(param.email, param.password)
    );
  }
}

import {
  GenericUserCredential,
  NextOrObserver,
  Unsubscribe,
  GenericAuthProvider,
  UserCredential,
  GenericOAuthProvider,
  CustomParameters,
  OAuthCredentialOptions,
  OAuthCredential,
  ProfileType,
  ActionCodeSettings,
  GenericAuthCredential,
  EmailAuthParamType,
} from "./auth.types";
import { GenericAuth, Persistence, GenericUser } from "./auth";
import {
  Auth,
  AuthCredential,
  EmailAuthProvider,
  OAuthProvider,
  User,
  applyActionCode,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { wrapNextOrObserver } from "./utils";

export class ModularFirebaseAuth implements GenericAuth<ModularFirebaseAuth> {
  private auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }
  newEmailAuthProvider(): GenericAuthProvider<
    ModularFirebaseAuth,
    EmailAuthParamType
  > {
    return new ModularEmailAuthProvider();
  }
  newOAuthProvider(
    providerId: string,
  ): GenericOAuthProvider<ModularFirebaseAuth> {
    return new ModularOAuthProvider(providerId);
  }

  sendPasswordResetEmail(
    email: string,
    actionCodeSettings?: ActionCodeSettings | undefined,
  ): Promise<void> {
    return sendPasswordResetEmail(this.auth, email, actionCodeSettings);
  }

  async createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<ModularFirebaseAuth>> {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    const wrappedCred: GenericUserCredential<ModularFirebaseAuth> = {
      user: new ModularFirebaseUser(cred.user),
      providerId: cred.providerId,
      operationType: cred.operationType,
    };
    return wrappedCred;
  }

  get currentUser(): GenericUser<ModularFirebaseAuth> | null {
    const user = this.auth.currentUser;
    return user == null ? null : new ModularFirebaseUser(user);
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<ModularFirebaseAuth>> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);

    const wrappedCred: GenericUserCredential<ModularFirebaseAuth> = {
      user: new ModularFirebaseUser(cred.user),
      providerId: cred.providerId,
      operationType: cred.operationType,
    };
    return wrappedCred;
  }

  onAuthStateChanged(
    nextOrObserver: NextOrObserver<GenericUser<ModularFirebaseAuth> | null>,
  ): Unsubscribe {
    const wrappedObserver: NextOrObserver<User | null> = wrapNextOrObserver(
      nextOrObserver,
      (user) => new ModularFirebaseUser(user),
    );

    return this.auth.onAuthStateChanged(wrappedObserver);
  }

  async signInWithPopup(
    provider: GenericAuthProvider<ModularFirebaseAuth, OAuthCredentialOptions>,
  ): Promise<UserCredential<ModularFirebaseAuth>> {
    if (!(provider instanceof ModularOAuthProvider))
      throw new Error("Only ModularOAuthProvider is supported");
    const cred = await signInWithPopup(
      this.auth,
      provider.handle,
      browserPopupRedirectResolver,
    );
    return {
      ...cred,
      user: new ModularFirebaseUser(cred.user),
    };
  }

  signInWithRedirect(
    provider: GenericAuthProvider<ModularFirebaseAuth, OAuthCredentialOptions>,
  ): Promise<UserCredential<ModularFirebaseAuth>> {
    if (!(provider instanceof ModularOAuthProvider))
      throw new Error("Only ModularOAuthProvider is supported");
    return signInWithRedirect(
      this.auth,
      provider.handle,
      browserPopupRedirectResolver,
    );
  }

  signOut() {
    return this.auth.signOut();
  }

  setPersistence(persistence: Persistence): Promise<void> {
    switch (persistence) {
      case "SESSION":
        return this.auth.setPersistence(browserSessionPersistence);
      case "LOCAL":
        return this.auth.setPersistence(indexedDBLocalPersistence);
      case "NONE":
        return this.auth.setPersistence(inMemoryPersistence);
    }
  }

  applyActionCode(oobCode: string): Promise<void> {
    return applyActionCode(this.auth, oobCode);
  }
}

export class ModularFirebaseUser implements GenericUser<ModularFirebaseAuth> {
  private user: User;

  constructor(user: User) {
    this.user = user;
  }
  async reauthenticateWithCredential(
    credential: GenericAuthCredential<ModularFirebaseAuth>,
  ): Promise<UserCredential<ModularFirebaseAuth>> {
    if (!(credential instanceof ModularAuthCredential))
      throw new Error("Credential must be ModularAuthCredential");

    const cred = await reauthenticateWithCredential(
      this.user,
      credential.handle,
    );
    return {
      ...cred,
      user: new ModularFirebaseUser(cred.user),
    };
  }

  updateEmail(newEmail: string): Promise<void> {
    return updateEmail(this.user, newEmail);
  }

  updateProfile(profile: ProfileType): Promise<void> {
    return updateProfile(this.user, profile);
  }

  sendEmailVerification(
    actionCodeSettings?: ActionCodeSettings | null | undefined,
  ): Promise<void> {
    return sendEmailVerification(this.user, actionCodeSettings);
  }
  updatePassword(newPassword: string): Promise<void> {
    return updatePassword(this.user, newPassword);
  }

  get emailVerified(): boolean {
    return this.user.emailVerified;
  }

  get isAnonymous(): boolean {
    return this.user.isAnonymous;
  }

  get refreshToken(): string {
    return this.user.refreshToken;
  }

  get tenantId(): string | null {
    return this.user.tenantId;
  }

  get displayName(): string | null {
    return this.user.displayName;
  }

  get email(): string | null {
    return this.user.email;
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

export class ModularAuthCredential
  implements GenericAuthCredential<ModularFirebaseAuth>
{
  handle: AuthCredential;

  constructor(handle: AuthCredential) {
    this.handle = handle;
  }

  get providerId(): string {
    return this.handle.providerId;
  }
}

class ModularEmailAuthProvider
  implements GenericAuthProvider<ModularFirebaseAuth, EmailAuthParamType>
{
  get providerId(): string {
    return EmailAuthProvider.PROVIDER_ID;
  }
  async credential(
    param: EmailAuthParamType,
  ): Promise<GenericAuthCredential<ModularFirebaseAuth>> {
    return new ModularAuthCredential(
      EmailAuthProvider.credential(param.email, param.password),
    );
  }
}

export class ModularOAuthProvider
  implements GenericOAuthProvider<ModularFirebaseAuth>
{
  handle: OAuthProvider;
  async credential(
    params: OAuthCredentialOptions,
  ): Promise<OAuthCredential<ModularFirebaseAuth>> {
    return new ModularAuthCredential(this.handle.credential(params));
  }
  addScope(
    scope: string,
  ): GenericAuthProvider<ModularFirebaseAuth, OAuthCredentialOptions> {
    const newHandle = this.handle.addScope(scope);
    this.handle = newHandle as OAuthProvider;
    return this;
  }
  getScopes(): string[] {
    return this.handle.getScopes();
  }

  constructor(providerId: string) {
    this.handle = new OAuthProvider(providerId);
  }

  get providerId(): string {
    return this.handle.providerId;
  }
  setDefaultLanguage(languageCode: string | null): void {
    this.handle.setDefaultLanguage(languageCode);
  }
  setCustomParameters(
    customOAuthParameters: CustomParameters,
  ): GenericAuthProvider<ModularFirebaseAuth, OAuthCredentialOptions> {
    const newHandle = this.handle.setCustomParameters(
      customOAuthParameters,
    ) as OAuthProvider;
    this.handle = newHandle;
    return this;
  }
}

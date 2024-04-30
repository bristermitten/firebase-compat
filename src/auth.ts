import {
  ActionCodeSettings,
  GenericAuthCredential,
  GenericAuthProvider,
  GenericOAuthProvider,
  GenericUserCredential,
  NextOrObserver,
  ProfileType,
  Unsubscribe,
  UserCredential,
  OAuthCredentialOptions,
  EmailAuthParamType,
} from "./auth.types";

export type Auth = GenericAuth<Auth>;

export type User = GenericUser<Auth>;

export interface GenericAuth<Auth extends GenericAuth<Auth>> {
  onAuthStateChanged(
    nextOrObserver: NextOrObserver<GenericUser<Auth> | null>,
  ): Unsubscribe;

  signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<Auth>>;

  createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<GenericUserCredential<Auth>>;

  signInWithPopup(
    provider: GenericAuthProvider<Auth, OAuthCredentialOptions>,
  ): Promise<UserCredential<Auth>>;

  signInWithRedirect(
    provider: GenericAuthProvider<Auth, OAuthCredentialOptions>,
  ): Promise<UserCredential<Auth>>;

  /**
   * Signs out the current user. This does not automatically revoke the user's ID token.
   */
  signOut(): Promise<void>;

  currentUser: GenericUser<Auth> | null;

  setPersistence(persistence: Persistence): Promise<void>;

  /**
   * Replacement for the Firebase OAuthProvider constructor
   * @param providerId
   */
  newOAuthProvider(providerId: string): GenericOAuthProvider<Auth>;

  newEmailAuthProvider(): GenericAuthProvider<Auth, EmailAuthParamType>;

  applyActionCode(oobCode: string): Promise<void>;

  sendPasswordResetEmail(
    email: string,
    actionCodeSettings?: ActionCodeSettings,
  ): Promise<void>;
}

export type Persistence = "SESSION" | "LOCAL" | "NONE";

/**
 * User profile information, visible only to the Firebase project's apps.
 *
 * @public
 */
export interface GenericUserInfo {
  /**
   * The display name of the user.
   */
  readonly displayName: string | null;
  /**
   * The email of the user.
   */
  readonly email: string | null;
  /**
   * The phone number normalized based on the E.164 standard (e.g. +16505550101) for the
   * user.
   *
   * @remarks
   * This is null if the user has no phone credential linked to the account.
   */
  readonly phoneNumber: string | null;
  /**
   * The profile photo URL of the user.
   */
  readonly photoURL: string | null;
  /**
   * The provider used to authenticate the user.
   */
  readonly providerId: string;
  /**
   * The user's unique ID, scoped to the project.
   */
  readonly uid: string;
}

export interface GenericUser<Auth extends GenericAuth<Auth>>
  extends GenericUserInfo {
  /**
   * Whether the email has been verified with {@link sendEmailVerification} and
   * {@link applyActionCode}.
   */
  readonly emailVerified: boolean;
  /**
   * Whether the user is authenticated using the {@link ProviderId}.ANONYMOUS provider.
   */
  readonly isAnonymous: boolean;
  /**
   * Deletes and signs out the user.
   *
   * @remarks
   * Important: this is a security-sensitive operation that requires the user to have recently
   * signed in. If this requirement isn't met, ask the user to authenticate again and then call
   * one of the reauthentication methods like {@link reauthenticateWithCredential}.
   */
  delete(): Promise<void>;
  /**
   * Returns a JSON Web Token (JWT) used to identify the user to a Firebase service.
   *
   * @remarks
   * Returns the current token if it has not expired or if it will not expire in the next five
   * minutes. Otherwise, this will refresh the token and return a new one.
   *
   * @param forceRefresh - Force refresh regardless of token expiration.
   */
  getIdToken(forceRefresh?: boolean): Promise<string>;
  /**
   * Refreshes the user, if signed in.
   */
  reload(): Promise<void>;
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  toJSON(): object;

  updateProfile(profile: ProfileType): Promise<void>;

  /**
   * Updates the user's email address.
   *
   * @remarks
   * An email will be sent to the original email address (if it was set) that allows to revoke the
   * email address change, in order to protect them from account hijacking.
   *
   * Important: this is a security sensitive operation that requires the user to have recently signed
   * in. If this requirement isn't met, ask the user to authenticate again and then call
   * {@link reauthenticateWithCredential}.
   *
   * @param newEmail - The new email address.
   *
   * @public
   */
  updateEmail(newEmail: string): Promise<void>;

  sendEmailVerification(
    actionCodeSettings?: ActionCodeSettings | null,
  ): Promise<void>;

  updatePassword(newPassword: string): Promise<void>;

  reauthenticateWithCredential(
    credential: GenericAuthCredential<Auth>,
  ): Promise<UserCredential<Auth>>;
}

export function onAuthStateChanged<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  nextOrObserver: NextOrObserver<GenericUser<Auth>>,
): Unsubscribe {
  return auth.onAuthStateChanged(nextOrObserver);
}

export function signInWithEmailAndPassword<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  email: string,
  password: string,
): Promise<GenericUserCredential<Auth>> {
  return auth.signInWithEmailAndPassword(email, password);
}

export function createUserWithEmailAndPassword<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  email: string,
  password: string,
): Promise<GenericUserCredential<Auth>> {
  return auth.createUserWithEmailAndPassword(email, password);
}

export function newOAuthProvider<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  providerId: string,
): GenericOAuthProvider<Auth> {
  return auth.newOAuthProvider(providerId);
}

/**
 * Updates a user's profile data.
 *
 * @param user - The user.
 * @param profile - The profile's `displayName` and `photoURL` to update.
 *
 * @public
 */
export function updateProfile<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
  profile: {
    displayName?: string | null;
    photoURL?: string | null;
  },
): Promise<void> {
  return user.updateProfile(profile);
}

/**
 * Updates the user's email address.
 *
 * @remarks
 * An email will be sent to the original email address (if it was set) that allows to revoke the
 * email address change, in order to protect them from account hijacking.
 *
 * Important: this is a security sensitive operation that requires the user to have recently signed
 * in. If this requirement isn't met, ask the user to authenticate again and then call
 * {@link reauthenticateWithCredential}.
 *
 * @param user - The user.
 * @param newEmail - The new email address.
 *
 * @public
 */
export function updateEmail<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
  newEmail: string,
): Promise<void> {
  return user.updateEmail(newEmail);
}

/**
 * Sends a verification email to a user.
 *
 * @remarks
 * The verification process is completed by calling {@link applyActionCode}.
 *
 * @example
 * ```javascript
 * const actionCodeSettings = {
 *   url: 'https://www.example.com/?email=user@example.com',
 *   iOS: {
 *      bundleId: 'com.example.ios'
 *   },
 *   android: {
 *     packageName: 'com.example.android',
 *     installApp: true,
 *     minimumVersion: '12'
 *   },
 *   handleCodeInApp: true
 * };
 * await sendEmailVerification(user, actionCodeSettings);
 * // Obtain code from the user.
 * await applyActionCode(auth, code);
 * ```
 *
 * @param user - The user.
 * @param actionCodeSettings - The {@link ActionCodeSettings}.
 *
 * @public
 */
export function sendEmailVerification<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
  actionCodeSettings?: ActionCodeSettings | null,
): Promise<void> {
  return user.sendEmailVerification(actionCodeSettings);
}

/**
 * Applies a verification code sent to the user by email or other out-of-band mechanism.
 *
 * @param auth - The {@link Auth} instance.
 * @param oobCode - A verification code sent to the user.
 *
 * @public
 */
export function applyActionCode<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  oobCode: string,
): Promise<void> {
  return auth.applyActionCode(oobCode);
}

/**
 * Updates the user's password.
 *
 * @remarks
 * Important: this is a security sensitive operation that requires the user to have recently signed
 * in. If this requirement isn't met, ask the user to authenticate again and then call
 * {@link reauthenticateWithCredential}.
 *
 * @param user - The user.
 * @param newPassword - The new password.
 *
 * @public
 */
export function updatePassword<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
  newPassword: string,
): Promise<void> {
  return user.updatePassword(newPassword);
}

/**
 * Sends a password reset email to the given email address.
 *
 * @remarks
 * To complete the password reset, call {@link confirmPasswordReset} with the code supplied in
 * the email sent to the user, along with the new password specified by the user.
 *
 * @example
 * ```javascript
 * const actionCodeSettings = {
 *   url: 'https://www.example.com/?email=user@example.com',
 *   iOS: {
 *      bundleId: 'com.example.ios'
 *   },
 *   android: {
 *     packageName: 'com.example.android',
 *     installApp: true,
 *     minimumVersion: '12'
 *   },
 *   handleCodeInApp: true
 * };
 * await sendPasswordResetEmail(auth, 'user@example.com', actionCodeSettings);
 * // Obtain code from user.
 * await confirmPasswordReset('user@example.com', code);
 * ```
 *
 * @param auth - The {@link Auth} instance.
 * @param email - The user's email address.
 * @param actionCodeSettings - The {@link ActionCodeSettings}.
 *
 * @public
 */
export function sendPasswordResetEmail<Auth extends GenericAuth<Auth>>(
  auth: Auth,
  email: string,
  actionCodeSettings?: ActionCodeSettings,
): Promise<void> {
  return auth.sendPasswordResetEmail(email, actionCodeSettings);
}

/**
 * Deletes and signs out the user.
 *
 * @remarks
 * Important: this is a security-sensitive operation that requires the user to have recently
 * signed in. If this requirement isn't met, ask the user to authenticate again and then call
 * {@link reauthenticateWithCredential}.
 *
 * @param user - The user.
 *
 * @public
 */
export function deleteUser<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
): Promise<void> {
  return user.delete();
}

/**
 * Re-authenticates a user using a fresh credential.
 *
 * @remarks
 * Use before operations such as {@link updatePassword} that require tokens from recent sign-in
 * attempts. This method can be used to recover from a `CREDENTIAL_TOO_OLD_LOGIN_AGAIN` error
 * or a `TOKEN_EXPIRED` error.
 *
 * @param user - The user.
 * @param credential - The auth credential.
 *
 * @public
 */
export function reauthenticateWithCredential<Auth extends GenericAuth<Auth>>(
  user: GenericUser<Auth>,
  credential: GenericAuthCredential<Auth>,
): Promise<UserCredential<Auth>> {
  return user.reauthenticateWithCredential(credential);
}

import { GenericAuth, GenericUser } from "./auth";

export type NextOrObserver<T> = NextFn<T | null> | Observer<T | null>;

export type NextFn<T> = (value: T) => void;

export interface Observer<T> {
  next: NextFn<T>;
  error: ErrorFn;
  complete: CompleteFn;
}

export type ErrorFn = (error: Error) => void;

export type CompleteFn = () => void;

export type Unsubscribe = () => void;

/**
 * A structure containing a {@link User}, the {@link OperationType}, and the provider ID.
 *
 * @remarks
 * `operationType` could be {@link OperationType}.SIGN_IN for a sign-in operation,
 * {@link OperationType}.LINK for a linking operation and {@link OperationType}.REAUTHENTICATE for
 * a reauthentication operation.
 *
 * @public
 */
export interface GenericUserCredential<Auth extends GenericAuth<Auth>> {
  /**
   * The user authenticated by this credential.
   */
  user: GenericUser<Auth>;
  /**
   * The provider which was used to authenticate the user.
   */
  providerId: string | null;
  /**
   * The type of operation which was used to authenticate the user (such as sign-in or link).
   */
  operationType: (typeof OperationType)[keyof typeof OperationType];
}

/**
 * The base class for all Federated providers (OAuth (including OIDC), SAML).
 *
 * This class is not meant to be instantiated directly.
 *
 * @public
 */
abstract class FederatedAuthProvider<Auth extends GenericAuth<Auth>, P>
  implements GenericAuthProvider<Auth, P>
{
  readonly providerId: string;
  /* Excluded from this release type: defaultLanguageCode */
  /* Excluded from this release type: customParameters */
  /**
   * Constructor for generic OAuth providers.
   *
   * @param providerId - Provider for which credentials should be generated.
   */
  constructor(providerId: string) {
    this.providerId = providerId;
  }
  /**
   * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
   * operations.
   *
   * @remarks
   * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
   * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
   *
   * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
   */
  abstract setCustomParameters(
    customOAuthParameters: CustomParameters,
  ): GenericAuthProvider<Auth, P>;

  abstract credential(param: P): Promise<GenericAuthCredential<Auth>>;
}

/**
 * Interface that represents an auth provider, used to facilitate creating {@link AuthCredential}.
 *
 * @public
 */
export interface GenericAuthProvider<Auth extends GenericAuth<Auth>, P> {
  /**
   * Provider for which credentials can be constructed.
   */
  readonly providerId: string;

  credential(param: P): Promise<GenericAuthCredential<Auth>>;
}

export type EmailAuthParamType = {
  email: string;
  password: string;
};

/**
 * Defines the options for initializing an {@link OAuthCredential}.
 *
 * @remarks
 * For ID tokens with nonce claim, the raw nonce has to also be provided.
 *
 * @public
 */
export interface OAuthCredentialOptions {
  /**
   * The OAuth ID token used to initialize the {@link OAuthCredential}.
   */
  idToken?: string;
  /**
   * The OAuth access token used to initialize the {@link OAuthCredential}.
   */
  accessToken?: string;
  /**
   * The raw nonce associated with the ID token.
   *
   * @remarks
   * It is required when an ID token with a nonce field is provided. The SHA-256 hash of the
   * raw nonce must match the nonce field in the ID token.
   */
  rawNonce?: string;
}

/**
 * Enumeration of supported operation types.
 *
 * @public
 */
export declare const OperationType: {
  /** Operation involving linking an additional provider to an already signed-in user. */
  readonly LINK: "link";
  /** Operation involving using a provider to reauthenticate an already signed-in user. */
  readonly REAUTHENTICATE: "reauthenticate";
  /** Operation involving signing in a user. */
  readonly SIGN_IN: "signIn";
};

export type ProfileType = {
  displayName?: string | null;
  photoURL?: string | null;
};

/**
 * An interface that defines the required continue/state URL with optional Android and iOS
 * bundle identifiers.
 *
 * @public
 */
export interface ActionCodeSettings {
  /**
   * Sets the Android package name.
   *
   * @remarks
   * This will try to open the link in an android app if it is
   * installed. If `installApp` is passed, it specifies whether to install the Android app if the
   * device supports it and the app is not already installed. If this field is provided without
   * a `packageName`, an error is thrown explaining that the `packageName` must be provided in
   * conjunction with this field. If `minimumVersion` is specified, and an older version of the
   * app is installed, the user is taken to the Play Store to upgrade the app.
   */
  android?: {
    installApp?: boolean;
    minimumVersion?: string;
    packageName: string;
  };
  /**
   * When set to true, the action code link will be be sent as a Universal Link or Android App
   * Link and will be opened by the app if installed.
   *
   * @remarks
   * In the false case, the code will be sent to the web widget first and then on continue will
   * redirect to the app if installed.
   *
   * @defaultValue false
   */
  handleCodeInApp?: boolean;
  /**
   * Sets the iOS bundle ID.
   *
   * @remarks
   * This will try to open the link in an iOS app if it is installed.
   *
   * App installation is not supported for iOS.
   */
  iOS?: {
    bundleId: string;
  };
  /**
   * Sets the link continue/state URL.
   *
   * @remarks
   * This has different meanings in different contexts:
   * - When the link is handled in the web action widgets, this is the deep link in the
   * `continueUrl` query parameter.
   * - When the link is handled in the app directly, this is the `continueUrl` query parameter in
   * the deep link of the Dynamic Link.
   */
  url: string;
  /**
   * When multiple custom dynamic link domains are defined for a project, specify which one to use
   * when the link is to be opened via a specified mobile app (for example, `example.page.link`).
   *
   *
   * @defaultValue The first domain is automatically selected.
   */
  dynamicLinkDomain?: string;
}

/**
 * A structure containing a {@link User}, the {@link OperationType}, and the provider ID.
 *
 * @remarks
 * `operationType` could be {@link OperationType}.SIGN_IN for a sign-in operation,
 * {@link OperationType}.LINK for a linking operation and {@link OperationType}.REAUTHENTICATE for
 * a reauthentication operation.
 *
 * @public
 */
export interface UserCredential<Auth extends GenericAuth<Auth>> {
  /**
   * The user authenticated by this credential.
   */
  user: GenericUser<Auth>;
  /**
   * The provider which was used to authenticate the user.
   */
  providerId: string | null;
  /**
   * The type of operation which was used to authenticate the user (such as sign-in or link).
   */
  operationType: (typeof OperationType)[keyof typeof OperationType];
}

/**
 * Interface that represents the credentials returned by an {@link GenericAuthProvider}.
 *
 * @remarks
 * Implementations specify the details about each auth provider's credential requirements.
 *
 * @public
 */
export interface GenericAuthCredential<Auth extends GenericAuth<Auth>> {
  handle: unknown;
}

/**
 * Represents the OAuth credentials returned by an {@link GenericOAuthProvider}.
 *
 * @remarks
 * Implementations specify the details about each auth provider's credential requirements.
 *
 * @public
 */
export interface OAuthCredential<Auth extends GenericAuth<Auth>>
  extends GenericAuthCredential<Auth> {
  /**
   * The OAuth ID token associated with the credential if it belongs to an OIDC provider,
   * such as `google.com`.
   * @readonly
   */
  idToken?: string;
  /**
   * The OAuth access token associated with the credential if it belongs to an
   * {@link GenericOAuthProvider}, such as `facebook.com`, `twitter.com`, etc.
   * @readonly
   */
  accessToken?: string;
  /**
   * The OAuth access token secret associated with the credential if it belongs to an OAuth 1.0
   * provider, such as `twitter.com`.
   * @readonly
   */
  secret?: string;
}

/**
 * Map of OAuth Custom Parameters.
 *
 * @public
 */
export type CustomParameters = Record<string, string>;

/**
 * Common code to all OAuth providers. This is separate from the
 * {@link GenericOAuthProvider} so that child providers (like
 * {@link GoogleAuthProvider}) don't inherit the `credential` instance method.
 * Instead, they rely on a static `credential` method.
 */
export interface BaseOAuthProvider<Auth extends GenericAuth<Auth>, P>
  extends FederatedAuthProvider<Auth, P> {
  /* Excluded from this release type: scopes */
  /**
   * Add an OAuth scope to the credential.
   *
   * @param scope - Provider OAuth scope to add.
   */
  addScope(scope: string): GenericAuthProvider<Auth, P>;
  // /**
  //  * Retrieve the current list of OAuth scopes.
  //  */
  // getScopes(): string[];
}

/**
 * Provider for generating generic {@link OAuthCredential}.
 *
 * @example
 * ```javascript
 * // Sign in using a redirect.
 * const provider = new OAuthProvider('google.com');
 * // Start a sign in process for an unauthenticated user.
 * provider.addScope('profile');
 * provider.addScope('email');
 * await signInWithRedirect(auth, provider);
 * // This will trigger a full page redirect away from your app
 *
 * // After returning from the redirect when your app initializes you can obtain the result
 * const result = await getRedirectResult(auth);
 * if (result) {
 *   // This is the signed-in user
 *   const user = result.user;
 *   // This gives you a OAuth Access Token for the provider.
 *   const credential = provider.credentialFromResult(auth, result);
 *   const token = credential.accessToken;
 * }
 * ```
 *
 * @example
 * ```javascript
 * // Sign in using a popup.
 * const provider = new OAuthProvider('google.com');
 * provider.addScope('profile');
 * provider.addScope('email');
 * const result = await signInWithPopup(auth, provider);
 *
 * // The signed-in user info.
 * const user = result.user;
 * // This gives you a OAuth Access Token for the provider.
 * const credential = provider.credentialFromResult(auth, result);
 * const token = credential.accessToken;
 * ```
 * @public
 */
export interface GenericOAuthProvider<Auth extends GenericAuth<Auth>>
  extends BaseOAuthProvider<Auth, OAuthCredentialOptions> {
  /**
   * Creates a {@link OAuthCredential} from a generic OAuth provider's access token or ID token.
   *
   * @remarks
   * The raw nonce is required when an ID token with a nonce field is provided. The SHA-256 hash of
   * the raw nonce must match the nonce field in the ID token.
   *
   * @example
   * ```javascript
   * // `googleUser` from the onsuccess Google Sign In callback.
   * // Initialize a generate OAuth provider with a `google.com` providerId.
   * const provider = new OAuthProvider('google.com');
   * const credential = provider.credential({
   *   idToken: googleUser.getAuthResponse().id_token,
   * });
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param params - Either the options object containing the ID token, access token and raw nonce
   * or the ID token string.
   */
  credential(params: OAuthCredentialOptions): Promise<OAuthCredential<Auth>>;
}

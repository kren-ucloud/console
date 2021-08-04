import Keycloak from 'keycloak-js';
import { store } from '@/store';
import { Authenticator } from '@/views/sign-in/authenticator';
import { SIGN_IN_ROUTE } from '@/routes/sign-in/sign-in-route';
import { SpaceRouter } from '@/routes';

class KeycloakAuth extends Authenticator {
    private static keycloak: Keycloak.KeycloakInstance;

    private static init() {
        const authOptions = store.state.domain.authOptions;
        const issuer = authOptions.issuer;
        const parsedIssuer = issuer.split('/');

        const authIndex = parsedIssuer.indexOf('auth');
        const baseUrl = parsedIssuer[authIndex - 1];

        const realm = authOptions.realm;
        // const realmIndex = parsedIssuer.indexOf('realms');
        // const realm = parsedIssuer[realmIndex + 1];

        const clientId = authOptions.client_id;


        const initOptions = {
            url: `https://${baseUrl}/auth`,
            realm,
            clientId,
        };
        KeycloakAuth.keycloak = Keycloak(initOptions);
    }

    private static async onSignInFail() {
        await SpaceRouter.router.replace({ name: SIGN_IN_ROUTE._NAME, query: { error: 'error' } });
        await KeycloakAuth.keycloak.logout();
    }

    static async signOut() {
        await super.signOut();
        // await KeycloakAuth.keycloak.logout();
    }

    private static async keycloakSignIn(auth) {
        if (!auth) {
            await KeycloakAuth.onSignInFail();
            return;
        }
        if (KeycloakAuth.keycloak.token && KeycloakAuth.keycloak.idToken && KeycloakAuth.keycloak.token !== '' && KeycloakAuth.keycloak.idToken !== '') {
            // eslint-disable-next-line camelcase
            console.log(KeycloakAuth.keycloak.tokenParsed);
            await super.signIn((KeycloakAuth.keycloak.idTokenParsed as any).profile.username || (KeycloakAuth.keycloak.idTokenParsed as any).preferred_username,
                { access_token: KeycloakAuth.keycloak.token });
        }
    }

    static async signIn(onSignInCallback) {
        KeycloakAuth.init();
        KeycloakAuth.keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
            .then(async (auth) => {
                await KeycloakAuth.keycloakSignIn(auth);
                await onSignInCallback();
            })
            .catch(async (e) => {
                console.error(e);
                await KeycloakAuth.onSignInFail();
            });
    }
}

export {
    KeycloakAuth,
};

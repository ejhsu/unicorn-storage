import { Box, CircularProgress } from '@mui/material';
import { GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isEmpty } from 'lodash-es';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';

import { auth, db, registerServiceWorker, ui } from './services/firebase';

function App() {
  const [authLoaded, setAuthLoaded] = useState(false);
  const [user, setUser] = useState(null);

  auth.onAuthStateChanged((resp) => {
    setUser(resp);
  });

  const checkAuth = async () => {
    await auth.authStateReady();
    setAuthLoaded(true);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authLoaded) {
      if (isEmpty(user)) {
        ui.start('#firebaseui-auth-container', {
          signInFlow: 'popup',
          signInOptions: [GoogleAuthProvider.PROVIDER_ID],
        });
      } else {
        try {
          registerServiceWorker(async (token) => {
            const userDoc = doc(db, '/fcm-tokens/1/user-tokens', user.email);
            const snapshot = await getDoc(userDoc);
            if (!snapshot.exists()) {
              await setDoc(userDoc, { tokens: [token] });
              return;
            }
            const userToken = snapshot.data();
            if (!userToken.tokens.includes(token)) {
              userToken.tokens.push(token);
            }
            setDoc(userDoc, userToken);
          });
        } catch (error) {
          alert('push error', error);
        }
      }
    }
  }, [authLoaded, user]);

  let content = <Outlet />;
  if (!authLoaded) {
    content = <CircularProgress />;
  } else if (isEmpty(user)) {
    content = <Box id="firebaseui-auth-container" />;
  }

  return (
    <>
      <Box className="w-svw h-svh flex justify-center items-center">{content}</Box>
    </>
  );
}

export default App;

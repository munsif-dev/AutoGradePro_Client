import { signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import {
  auth,
  provider,
  db,
} from "@/app/(auth)/(routes)/_components/firebaseConfig";

const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user already has a role set in Firestore
    const docRef = doc(db, "users", user.uid);
    await setDoc(
      docRef,
      {
        email: user.email,
        role: "pending", // Set role to pending initially
        isRolePending: true,
      },
      { merge: true }
    );

    window.location.href = "/select-role"; // Redirect to role selection page
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
  }
};

export default handleGoogleSignIn;

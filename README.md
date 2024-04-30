# firebase-compat

A compatibility layer for Firebase's SDK for JavaScript, supporting Web, Web Compat, and`react-native-firebase`

Usage should be almost identical to Firebase's modular SDK - simply use `firebase-compat` as an import.

The main goal of this project is to eliminate as much platform-specific code as possible, while minimising API changes.
Sometimes this comes at the cost of performance - for example, when creating / querying documents with `Date` fields in them, Firebase will convert the `Date` to a `Timestamp` before sending it to the server. `firebase-compat` therefore needs to do a little more work when _querying_ a document to convert the `Timestamp` back to a `Date`.

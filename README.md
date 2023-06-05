## Web-browser crossword editing / solving tool

This is a tool for editing / solving crosswords in a web-browser. I have some relatives who like to work on crossword puzzles together over video call - I made this for them to make it easier to keep the puzzle synced across the call.

Live at [crossword.gloudemans.fun](https://crossword.gloudemans.fun)

### Cool features:

**Collaborative Editing**: Different users can work together on a single puzzle - the host creates a game code, and other users can enter the game code to join. Any edits made by any user sync in real time for all participants

**Picture-to-puzzle**: Rather than manually selecting all the black boxes to setup the puzzle, you can automatically set the puzzle up using a photo. Just upload a photo and select the corners of the puzzle in the image, and the puzzle will auto-adjust to the correct dimensions and autofill the black boxes.

### Technologies used:

**Hosting**: Originally used GitHub pages, moved to Firebase Hosting when I started using other GCP services for the extra features

**Collaborative editing**: Firebase Realtime Database makes this really straightforward. Just add the SDK in JavaScript and add some reading and writing and callbacks

**Picture-to-puzzle**: Made a really basic Cloud Run microservice with a single POST endpoint that takes in an image and spits out a grid of 1s and 0s representing the puzzle. Written in Python - Flask for the server, OpenCV / Numpy for the image processing

**Version control / deployment**: Both the web app sever (Firebase Hosting) and the Cloud Run microservice are linked to this GitHub repo - any changes to the master branch trigger a re-deploy of the website, and changes to the crossword-from-image directory trigger Cloud Build to build the container and upgrade to the latest version. Also if I create a PR of a branch into master, Firebase creates a temporary url with the new version, so I can make sure the changes are working before merging. Pretty cool stuff!

![Sreenshot of the crossword editor](crossword_editor.png)

# CEA School Website
Responsive English/Urdu website for Chakesar Education Academy High School Danakool.

## Pages
Home, About, Admissions, Results, Gallery, Student Portal, Login, Sign Up, FAQs and Contact.

## Replace the sample photos
The current site uses temporary sample photography so the design has visual backgrounds while you prepare your own school photos.
- The homepage hero photo is set in `style.css` in the `.hero` background rule.
- The inner page banner photo is set in `style.css` in the `.page-hero` background rule.
- Photos inside sections and the gallery are referenced in `index.html`, `about.html`, and `gallery.html`.
Upload your photos into this folder and change those image paths to (for example) `assets/school-building.jpg`.

Replace `assets/logo.svg` with your official school logo (or change the logo image path in `script.js`).

## Publish
Keep `index.html` in the repository root. GitHub Pages should publish from branch `main`, folder `/(root)`.

## Important
Admission, login, signup and result lookup screens are front-end demos. They do not save student information, authenticate users or retrieve real results. Connect a secure school database and authentication service before collecting student information.
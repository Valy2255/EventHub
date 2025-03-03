# EventHub - Aplicație de vânzare bilete

Aplicație completă pentru achiziționarea biletelor la evenimente diverse (concerte, teatru, sport, festivaluri, etc).

## Structura proiectului

Proiectul este împărțit în două componente principale:

- **/frontend**: Aplicație React + Vite cu Tailwind CSS
- **/backend**: Server Node.js cu Express și PostgreSQL

## Funcționalități

- Căutarea și filtrarea evenimentelor
- Procesarea plăților pentru bilete
- Generarea biletelor în format PDF cu coduri QR
- Sistem de recomandări bazat pe geolocalizare
- Autentificare socială (Google, Facebook)
- Anularea biletelor cu rambursare, conform politicii evenimentului
- Validarea biletelor la intrare prin scanarea codurilor QR

## Tehnologii utilizate

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Formik & Yup
- jsPDF
- QR Code Generator

### Backend
- Node.js
- Express
- PostgreSQL
- JSON Web Tokens (JWT)
- Passport.js
- Multer
- Nodemailer


# Rämidate &mdash; A Dating App
This is a dating app developed as a high-school thesis.

## How to run project locally
To run Rämidate locally, you will need to start both the backend (Django) and the frontend (React) servers simultaneously.

### 1. Prerequisites
Ensure you have the following installed:
- [Python 3.13+](https://www.python.org/)
- [Node.js v22.15.0+](https://nodejs.org/en)

### 2. Backend Setup
Navigate to the `backend/` directory and set up the backend:

Create a file named `.env` and define the required variables as shown in `.env.example`.

In `backend/core/settings.py`, find the `DEPLOY` variable definition and set it to `False`.

Next run the following commands in the terminal for Windows:
```bash
cd backend
python -m venv venv
venv/Scripts/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```
On MacOs/Linux run this instead:
```bash
cd backend
python -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```
Create a user with admin access by providing the required fields. Note that the typed in password doesn't show in the
terminal instead of showing asterisks.

### 3. Frontend Setup
Navigate to the `frontend/` directory and set up the frontend:

Create a file named `.env` and define the required variables as shown in `.env.example`.

Next run the following commands in the terminal:
```bash
cd frontend
npm install
```

### 4. Start the servers
In the `backend/` folder, run:
```
cd backend
py manage.py runserver
```
In the `frontend/` folder in a separate terminal, run:
```
cd frontend
npm run dev
```
The backend will now be running at http://127.0.0.1:8000/ and the frontend at http://localhost:5173/. If that is not the case, change the environment variables accordingly.

In the backend, `/admin` is the Admin Interface and under `/api` one can access the REST API endpoints by adding the proper
path. Locally, sent emails are shown in the console. 

## How to run set up SMTP email backend with Gmail

### 1. Prerequisites
- A Gmail account with 2-step verification turned on

### 2. Setup
1. Go to My [Google Account](https://myaccount.google.com)
2. Search for "App passwords", create one and copy paste it.
3. In `backend/.env`, set `EMAIL_HOST_USER` to the chosen `@gmail.com` address and `EMAIL_HOST_PASSWORD` to the copied app password.
4. In `backend/core/settings.py`, find the `SMTP_EMAIL` variable definition and set it to `True`.

Emails will now be sent from the chosen email address.

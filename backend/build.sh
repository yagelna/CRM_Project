set -o errexit

# Build the backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

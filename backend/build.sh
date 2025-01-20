set -o errexit

# Build the backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

# Check if superuser should be created
python manage.py shell -c "from apps.users.models import CustomUser; CustomUser.objects.create_superuser(email='admin@example.com', password='password123')"
if [[ $CREATE_SUPERUSER ]] then
    python manage.py shell -c "
import os
from apps.users.models import CustomUser

email = os.environ.get('SUPERUSER_EMAIL')
password = os.environ.get('SUPERUSER_PASSWORD')

if email and password:
    if not CustomUser.objects.filter(email=email).exists():
        CustomUser.objects.create_superuser(email=email, password=password)
        print(f'Superuser {email} created.')
    else:
        print(f'Superuser {email} already exists.')
else:
    print('Missing SUPERUSER_EMAIL or SUPERUSER_PASSWORD environment variables.')
"
fi
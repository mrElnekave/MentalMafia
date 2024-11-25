import subprocess

from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes

PADDING = padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )


MPC_DIRECTORY = '.'

# Also part of state
detective_public_key = None
detective_private_key = None
# end state

def generate_detective_key_pair():
    """
    Generate a key pair for the detective.
    """
    # command: openssl req -newkey rsa -nodes -x509 -out $ssl_dir/P$i.pem -keyout $ssl_dir/P$i.key -subj "/CN=P$i"
    command = ['openssl', 'req', '-newkey', 'rsa', '-nodes', '-x509', '-out', f'{MPC_DIRECTORY}/Player-Data/detective.pem', '-keyout', f'{MPC_DIRECTORY}/Player-Data/detective.key', '-subj', f'"/CN=detective"']
    _ = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def populate_detective_pk():
    global detective_public_key
    with open(f'{MPC_DIRECTORY}/Player-Data/detective.pem', 'r') as f:
        detective_public_key = x509.load_pem_x509_certificate(f.read(), default_backend()).public_key()

def populate_detective_sk():
    global detective_private_key
    with open(f'{MPC_DIRECTORY}/Player-Data/detective.key', 'r') as f:
        detective_private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )

def encrypt_with_public_key(data: bytes) -> bytes:
    return detective_public_key.encrypt(
        data,
        PADDING
    )

def decrypt_with_private_key(ciphertext: bytes) -> bytes:
    return detective_private_key.decrypt(
        ciphertext,
        PADDING
    )

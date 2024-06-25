from flask import Flask, render_template,request, jsonify, session, redirect
from cs50 import SQL
import hashlib, re,os,binascii
from flask_session import Session
from datetime import datetime, timedelta
from flask_mail import Mail, Message
from flask_wtf.csrf import CSRFProtect

#Connect to database
db = SQL("sqlite:///data.sqlite")
app = Flask(__name__)
#generation de la cle secrete
app.secret_key = b'\xff-g\xee\x9b2S\xabB\xba\x9f\xbfS\xcb]\x0b\xc8\x11\xf9\x8b0\x00\xa6\xa9'
app.config['TEMPLATES_FOLDER'] = 'templates'
app.config['SESSION_TYPE'] = 'filesystem'
app.config["SESSION_PERMANENT"] = False
app.config['WTF_CSRF_ENABLED'] = True
csrf = CSRFProtect(app)
Session(app)

# Configuration Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv ('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv ('MAIL_DEFAULT_SENDER')

mail = Mail(app)

@app.route('/', methods=["POST", "GET"])
def home():
    if session.get('id'):
        return redirect('/index')
    else:
        return redirect('/login')
        
        
@app.route('/login', methods=["POST", "GET"])
def login():
    if request.method == "POST":
        username= request.form.get("user")
        password= request.form.get("pass").strip()
        base= db.execute("SELECT * FROM Users WHERE nom_user=? and password=?  ", username, hash_password(password)) 
        if base:
            resultat = db.execute("SELECT * FROM Users WHERE nom_user =?" , username)
            statut= resultat[0]['statut']
            user_id = resultat[0]["id"]
            session['id']= user_id
            session['statut']= statut
            return redirect('/index')
        else:
            return render_template('login.html' , error="Informations non valides")
    else:
        return render_template('login.html')
    
    
@app.route('/index', methods= ["POST", "GET"])
def index():
    if session.get('id'):
        if request.method == "POST" :
            coordonnees= request.form.get("coordo").split(",")
            lieuD=coordonnees[1]
            lieuA = request.form.get("search")
            name= db.execute("SELECT nom_user FROM Users where id =?", session.get('id'))
            name= name[0]["nom_user"]
            db.execute("INSERT INTO historique( nom_technicien, lieuD, lieuA ) VALUES(?,?,?)",name ,lieuD,lieuA)
            return jsonify({"message" : "succes"})
        else:
            coordonnees = db.execute("SELECT* FROM  Marqueur ")
            print(session.get('statut'))
            return render_template("index.html", coordonnees=coordonnees,statut= session.get("statut"))
    else:
        return redirect('/login')
    

@app.route('/marqueur', methods= ["POST", "GET"] )
def marqueur():
    if session.get('id'):
       
        if request.method == "POST" :
            latitude = request.form.get("latitude")
            longitude =request.form.get("longitude")
            description = request.form.get("description")
            db.execute("INSERT INTO Marqueur(longitude, latitude,description) VALUES(?,?,?)", longitude, latitude, description)
            donnee = {"message" : "succes"}
        return jsonify(donnee)
    else:
        return redirect('/login')
   
@app.route('/coordonnees' , methods=["POST","GET"])
def coordonnees():

    if request.method == "GET" :
        info= db.execute("SELECT* FROM Marqueur")
        
        return jsonify(info)


@app.route('/deconnexion')
def logout():
    #suppression des informationns de l'utilisateur
    session.clear()
    # redirection vers la page de connexion
    return redirect("/login")

@app.route('/compte', methods=['GET', 'POST'])
def compte():
    if request.method=='GET':
        return render_template('compte.html')
    else:
        name=request.form.get("user")
        mail= request.form.get("mail")
        passw= request.form.get("passw")
        newp= request.form.get("new_passw")
        statut= request.form.get("statut")
        errors = []       
        if not re.search(r"^\w+@\w+\.\w+$", mail):
            errors.append("invalid email")
        else:
            base = db.execute("SELECT * FROM Users WHERE e_mail = ?", mail)
            if base:
                errors.append(" Cette adresse e-mail existe deja")
            else:
                if len(name) < 8:
                    errors.append("Le nom d'utilisateur doit contenir au moins 08 caracteres")
                else:
                    if not re.search(r"^\w+$", name):
                         errors.append("Le nom d'utilisateur ne doit pas contenir des espaces ou des caracteres speciaux")
                    else:
                        nom = db.execute("SELECT nom_user FROM Users WHERE nom_user = ?", name)
                        if nom :
                            errors.append("Ce nom d'utilisateur existe deja. Veuillez en choisir un autre.")
                            return render_template("compte.html", errors=errors)
                if passw != newp :
                    errors.append("Mot de passe differents")
                else:
                    if len (passw) < 8:
                        errors.append("Le mot de passe doit contenir au moins 08 caracteres")
                    else:
                        if not re.search(r"^\w+$", passw):
                            errors.append("Le mot de passe ne doit pas contenir des espaces ou des caracteres speciaux")

        if errors:
            return render_template("compte.html", errors=errors)
        else:
            db.execute("INSERT into Users( nom_user, e_mail, password, statut) values(?,?,?,?)" , name, mail, hash_password(passw), statut)
            base = db.execute("SELECT id FROM Users WHERE nom_user = ?" , name)
            session['id'] = base[0]['id']
            return redirect("/index")
        
        
def hash_password(password):
        password_bytes = password.encode('utf-8')
        hashed_password = hashlib.sha256(password_bytes).hexdigest()
        return hashed_password

@app.route('/change' , methods=["POST","GET"])
def change():
        if session.get('id'):
            if request.method == 'GET':
                return render_template('change.html')
            elif request.method == 'POST':
                print(request.form.get)
                ancien_mot_de_passe = request.form.get('passw')
                nouveau_mot_de_passe = request.form.get('pass')
                errors=[]
                print(ancien_mot_de_passe, nouveau_mot_de_passe)
                # Vérification de l'ancien mot de passe
                
                mot_de_passe_hache_ancien = hash_password(ancien_mot_de_passe)

                utilisateur = db.execute('SELECT * FROM Users WHERE id = ? AND password = ?', session.get('id'), mot_de_passe_hache_ancien)

                if utilisateur is None:
                    erreur = 'mot de passe incorrect.'
                    return render_template('change.html', erreur=erreur)
                else:
                    if len (nouveau_mot_de_passe) < 8:
                        errors.append("Le mot de passe doit contenir au moins 08 caracteres")
                    else:
                        if not re.search(r"^\w+$", nouveau_mot_de_passe):
                            errors.append("Le mot de passe ne doit pas contenir des espaces ou des caracteres speciaux")
                        else:
                            # Hachage du nouveau mot de passe
                            mot_de_passe_hache_nouveau = hash_password(nouveau_mot_de_passe)

                # Mise à jour du mot de passe haché dans la base de données
                db.execute('UPDATE Users SET password = ? WHERE id = ?', mot_de_passe_hache_nouveau, session.get(id))
                print('Mot de passe modifié avec succès.')
                return redirect(('/index'))
        else:
            return redirect('/login')

@app.route('/update_marqueur' , methods=["POST", "GET"])
@csrf.exempt
def update_marqueur():
    if session.get('id') and request.method == "POST":
        id= request.form.get("id")
        lat= request.form.get("latitude")
        long=request.form.get("longitude")
        descrip= request.form.get("description")
        # Mise à jour de la description du marqueur dans la base de données
        db.execute("UPDATE Marqueur SET description=? , latitude=? , longitude=? WHERE id=?", descrip,lat, long, id)
        print("success")
        # Renvoyer une réponse de succès
        return jsonify({"success": True})
    else:
        # Gérer l'accès non autorisé ou la méthode de requête invalide
        return jsonify({"error": "Requête non autorisée ou invalide"}), 401
    
@app.route('/delete_marqueur/<id_marker>' , methods=["GET"])
def delete_marqueur(id_marker) :
    if session.get('id') and request.method == "GET":
        db.execute("DELETE FROM Marqueur WHERE id=?", id_marker)
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Requête non autorisée ou invalide"}), 401
def generate_reset_link(email):
    # Générer un jeton aléatoire
    token = binascii.hexlify(os.urandom(24)).decode()
    expires_at = (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
    db.execute('INSERT INTO reset_tokens (email, token, expires_at) VALUES (?, ?, ?)', email, token, expires_at)
    return f"https://charmed-inviting-grizzly.ngrok-free.app/reset_password?email={email}&token={token}"

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
            email = request.form.get('email')
            
            # Vérifier si l'email existe dans la base de données simulée
            if db.execute("SELECT  e_mail FROM Users WHERE e_mail=?", email):
                # Générer un lien de réinitialisation unique
                reset_link = generate_reset_link(email)
                
                # Envoyer un e-mail à l'utilisateur avec le lien de réinitialisation
                msg = Message('Réinitialisation de votre mot de passe',recipients=[email],
                            body=f"Bonjour, veuillez cliquer sur ce lien pour réinitialiser votre mot de passe : {reset_link}")
                mail.send(message=msg)
                
                # Rediriger vers une page de confirmation
                return redirect('/login')
            else:
                 
                return render_template('forgot_password.html', error='Email non trouvé.')

    error = session.pop('error', None)
    return render_template('forgot_password.html', error=error)

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email')
    token = request.args.get('token')
    
    # Vérifier si le jeton est valide et non expiré
    valid_token = db.execute('SELECT * FROM reset_tokens WHERE email = ? AND token = ? ', email, token)
    variable = valid_token[0]['expires_at']
    variable = datetime.strptime(variable, '%Y-%m-%d %H:%M:%S')
    if variable > datetime.now():
        if request.method == 'POST':
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')

            if new_password == confirm_password:
                # Mettre à jour le mot de passe dans la base de données
                db.execute('UPDATE Users SET password = ? WHERE e_mail = ?', hash_password(new_password), email)
                
                # Supprimer les jetons de réinitialisation associés
                db.execute('DELETE FROM reset_tokens WHERE email = ?', email)
                
                    
                return redirect('/login')  # Rediriger vers la page de connexion
            else:
                return "Les mots de passe ne correspondent pas."

        return render_template('reset_password.html', email=email)
    else:
        return "Lien de réinitialisation invalide ou expiré."
    
@app.route('/historique' , methods=['POST', 'GET'])
def historique():
    if session.get('id'):
        if request.method == "GET":
            historiques=db.execute ("SELECT* FROM historique")
            return render_template("historique.html" , historiques=historiques,statut= session.get("statut"))
    else:
        return redirect('/login')

@app.route('/gestionnaire' , methods=['POST', 'GET'])
def gestionnaire():
    if session.get('id'):
        if request.method == "GET":
            users= db.execute('SELECT* FROM Users')
            return render_template('gestionnaire.html' , users = users,statut= session.get("statut") )
    else:
        return redirect('/login')
    
@app.route('/delete_user', methods=["GET"])
def delete_user():
    if session.get('id') and request.method == "GET":
        new_id = request.args.get("id")
        db.execute("DELETE FROM Users WHERE id=?", new_id)
        return redirect('/gestionnaire')
    
if __name__ == '__main__':
    app.run(debug=True)

#ngrok http --domain=charmed-inviting-grizzly.ngrok-free.app 80
window.onload = function() {
   
    // Initialisation de la carte

    const addMarkerButton = document.getElementById("add-marker-btn");
    const traceRouteButton = document.getElementById("trace-route-btn");
    const addmarkerbtn = document.getElementById("addmarkerbtn");
    const togglemarkerformbtn = document.getElementById("togglemarkerformbtn");
    const traceroutebtn = document.getElementById("traceroutebtn");
    const togglerouterformbtn = document.getElementById("togglerouterformbtn");
    var button = document.getElementById("button")
    button.addEventListener('click', confirmlogout)
    addMarkerButton.addEventListener("click", toggleMarkerForm);
    traceRouteButton.addEventListener("click", toggleRouterForm);
    addmarkerbtn.addEventListener("click", addMarker);
    togglemarkerformbtn.addEventListener("click", toggleMarkerForm);
    traceroutebtn.addEventListener("click", traceroute);
    togglerouterformbtn.addEventListener("click", toggleRouterForm);
    var antenneIcon = L.icon({
        iconUrl: 'static/images/antenne.jpg',
        iconSize: [32, 32],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
        //shadowUrl: 'static/images/antenne.jpg',
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
    });

    var map = L.map('map').setView([7.3697, 12.3547], 7);

    fetch("/coordonnees")
    .then(response => response.json())
.then(data => {

    data.forEach(function(marker) {
        L.marker([marker.latitude, marker.longitude], {icon: antenneIcon})
            .addTo(map)
            .bindPopup('Latitude: ' + marker.latitude + '<br>Longitude: ' + marker.longitude + '<br>description:' +marker.description).on('popupopen',function(e) {
                makePopupEditable(e, marker);
            });
    });
    })
    .catch(error => {
        
    });    
    // Ajout des tuiles de carte OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', function(e) {
var message = "Vous avez cliqué à l'emplacement : " + e.latlng.lat + ", " + e.latlng.lng;
$('#message').text(message);
$('#message').show();
});

    
    // Fonction pour ajouter un marqueur
    function addMarker() {
        // Récupérer les coordonnées de latitude et longitude à partir du formulaire
        var latitude = parseFloat(document.getElementById('latitude').value);
        var longitude = parseFloat(document.getElementById('longitude').value);
        var description= (document.getElementById('description').value)
        var formulaire= document.getElementById("add-marker-form");

        // Vérifier si les valeurs sont valides
        if (!isNaN(latitude) && !isNaN(longitude)) {
            
            //creation de l'icone personnalisee avec l'image de l'antenne
            var antenneIcon = L.icon({
                iconUrl: 'static/images/antenne.jpg',
                iconSize: [32, 32],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76],
                //shadowUrl: 'static/images/antenne.jpg',
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            });

            // Ajouter le marqueur  avec l'icone personnalisee à la carte
            L.marker([latitude, longitude], {icon: antenneIcon}).addTo(map)
                .bindPopup('Latitude: ' + latitude + '<br>Longitude: ' + longitude + '<br> description:' + description)
                .openPopup();

            location.reload(true)
            // Centrer la carte sur le nouveau marqueur
            map.setView([latitude, longitude], 15);

            // Masquer le formulaire
            toggleMarkerForm();
        } else {
            alert('Veuillez saisir des valeurs valides pour la latitude et la longitude.');
        }
        formData = new FormData(formulaire);
            fetch("/marqueur", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
           /* .then(data => {
                // a faire
            })*/
            .catch(error => {
                console.log(error)
            });    

    }

    // Fonction pour afficher/masquer le formulaire d'ajout de marqueur 
    function toggleMarkerForm() {
        var form = document.getElementById('add-marker-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
     // Fonction pour afficher/masquer le formulaire de tracage d'itineraire de marqueur 
     function toggleRouterForm() {
        var form = document.getElementById('trace-route-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        document.getElementById('search-input').addEventListener('input', debounce(handleStopTyping, 1000));
    }
    
// Fonction de décalage pour retarder l'exécution du callback
function debounce(callback, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(context, args), delay);
    };
}

// Fonction à exécuter quand l'utilisateur arrête de taper
function handleStopTyping(event) {
    console.log('L\'utilisateur a arrêté de taper. Valeur de l\'input :', event.target.value);
    var query = document.getElementById("search-input").value;
    performSearch(query);
}


  
// Initialiser le geocoder
var geocoder = L.Control.Geocoder.nominatim();

// Variable pour stocker le marqueur actuel
var currentMarker = null;

// Fonction pour effectuer la recherche
function performSearch(query) {
    if (query.length < 3) {
        return; // Ne pas rechercher si la requête est trop courte
    }
    geocoder.geocode(query, function(results) {
        if (results.length === 0) {
            console.log("Aucun résultat trouvé");
            return;
        }
        var result = results[0];
        var latlng = result.center;

        // Supprimer le marqueur actuel s'il existe
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Ajouter un nouveau marqueur sur la carte
        currentMarker = L.marker(latlng).addTo(map)
            .bindPopup(result.name)
            .openPopup();

        // Centrer la carte sur le résultat
        map.setView(latlng, 13);

        // Afficher les coordonnées dans une alerte
        console.log('Coordonnées : ', latlng.lat, latlng.lng);
        var adrClient= document.getElementById("coordClt")
        adrClient.value= `${latlng.lat} ${latlng.lng}`
    });
}
    //ajout d'un itineraire
    function traceroute(){
        // Récupérer les coordonnées de latitude et longitude à partir du formulaire
        var coordonnees= document.getElementById('coord').value.split(" ");
        var latitudeD = coordonnees[0];
        var longitudeD = coordonnees[1];
        var coordClt= document.getElementById('coordClt').value.split(" ");
        var latitudeA = coordClt[0];
        var longitudeA = coordClt[1];  
        var formulaire= document.getElementById("trace-route-form");

        // Vérifier si les valeurs sont valides
        if (!isNaN(latitudeD) && !isNaN(longitudeD) &&!isNaN(latitudeA) && !isNaN(longitudeA)) {
            var markers = [];
            
        
        // Ajouter les marqueurs  avec les icones personnalisees à la carte
        markers.push(L.marker([latitudeD, longitudeD]));
        markers.push(L.marker([latitudeA, longitudeA]));

        //Ajouter les marqueur d'antennes au tableau
        var startIcon = L.icon({
            iconUrl: 'static/images/antenne.jpg',
                iconSize: [32, 32],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76],
                //shadowUrl: 'static/images/antenne.jpg',
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
        });
        
        // Ajouter le marqueur avec l'icone personnalisee à la carte
        markers.push(L.marker([latitudeD, longitudeD], {icon: startIcon}));

        var endIcon = L.icon({
                iconSize: [32, 32],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76],
                //shadowUrl: 'static/images/antenne.jpg',
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
        });
        

        // Ajouter le marqueur avec l'icone personnalisee à la carte
        markers.push(L.marker([latitudeA, longitudeA]));
        
        // creation d'un groupe de marqueurs a partir du tableau
        var markergroup = L.featureGroup(markers);
        //ajouter le groupe de marqueur a la carte
        markergroup.addTo(map);
        // centrer la carte sur les marqueurs
        map.fitBounds(markergroup.getBounds());
        
            //tracer l'itineraire a partir des données fournis
            L.Routing.control({
                waypoints: [
                  L.latLng(latitudeD, longitudeD),
                  L.latLng(latitudeA, longitudeA)
                ]
              }).addTo(map);
        }
        toggleRouterForm();
        formData = new FormData(formulaire);
            fetch("/index", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
           .then(data => {
                console.log(data)
            })
            .catch(error => {
                console.log(error)
            });    
       
    }
    function confirmlogout() {
        var userConfirmed = confirm("Voulez-vous vraiment vous déconnecter?");
        if (userConfirmed) {
            console.log("Utilisateur a confirmé la déconnexion.");
            window.location.href = '/deconnexion';
        } else {
            console.log("Utilisateur a annulé la déconnexion.");
        }
    }  
  };

  // Fonction pour rendre le popup modifiable
  function makePopupEditable(e,id_marker) {
    var message = "Vous avez cliqué à l'emplacement : " + id_marker.latitude + ", " + id_marker.longitude;
    $('#message').text(message);
    $('#message').show();
    var popup = e.target.getPopup();
    console.log(id_marker);
   

    // Création d'un textarea pour l'édition
    var editableContent = document.createElement('p');
    editableContent.innerHTML= ` latitude : ${id_marker.latitude} <br> longitude:${id_marker.longitude} <br> Description : ${id_marker.description} `;
    var div= document.getElementById("divModal")
     div.innerHTML = ` 
    <!-- The Modal -->
<div class="modal" id="myModal">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">

      <!-- Modal Header -->
      <div class="modal-header">
        <h4 class="modal-title">Informations</h4>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <!-- Modal body -->
      <div class="modal-body">
        <form  id="formModal"> 
        <input type="hidden" name="id" value= "${id_marker.id}"   class="form-control"> 
        <label> Latitude</label>
        <input type="text" name="latitude" value= "${id_marker.latitude}"   class="form-control"> 
         <label>Longitude</label>
        <input type="text" name="longitude"  value= "${id_marker.longitude}"  class="form-control"> 
        <label>Description</label>
        <textarea name="description"  class="form-control">${id_marker.description}</textarea>
        </form>
      </div>

      <!-- Modal footer -->
      <div class="modal-footer">
      <button type="submit" class="btn btn-success" id="btnValider" data-bs-dismiss="modal">Valider</button>
        <button type="button" class="btn btn-danger" id="btnSupprimer" data-bs-dismiss="modal">Supprimer</button>
        
      </div>

    </div>
  </div>
</div>`
document.body.appendChild(div);

// Création d'un bouton de sauvegarde
    var saveButton = document.createElement('button');
    saveButton.textContent = 'Modifier';
    saveButton.type = 'button';
    saveButton.className = 'btn btn-primary';
    saveButton.setAttribute('data-bs-toggle', 'modal');
    saveButton.setAttribute('data-bs-target', '#myModal');


document.getElementById("btnValider").addEventListener('click', function(){
    formData = new FormData(document.getElementById("formModal"));
        fetch("/update_marqueur", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
       .then(data => {
        console.log(data)
        if(data.success) {
            location.reload(true);
        }
            
        })
        .catch(error => {
            console.log(error)
        });  
})
document.getElementById("btnSupprimer").addEventListener('click', function(){
        fetch(`/delete_marqueur/${id_marker.id}` )
        .then(response => response.json())
       .then(data => {
        console.log(data)
        if(data.success) {
            location.reload(true);
        }
        })
        .catch(error => {
            console.log(error)
        });  
})

    // Remplacement du contenu du popup par le textarea et le bouton
    var popupContainer = document.createElement('div');
    popupContainer.appendChild(editableContent);
    popupContainer.appendChild(saveButton);

    popup.setContent(popupContainer);
    e.target.openPopup();
}


  

  

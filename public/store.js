let stores = [];

function loadStores() {
    fetch('/api/puntos-venta')
        .then(response => response.json())
        .then(data => {
            stores = data;
            const departmentSelect = document.getElementById('department-select');
            const departments = [...new Set(data.map(store => store.Departamento))];
            departments.forEach(department => {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                departmentSelect.appendChild(option);
            });

            departmentSelect.addEventListener('change', () => {
                const department = departmentSelect.value;
                const storeSelect = document.getElementById('store-select');
                storeSelect.innerHTML = '<option value="">Selecciona un punto de venta</option>';
                if (department) {
                    const filteredStores = data.filter(store => store.Departamento === department);
                    filteredStores.forEach(store => {
                        const option = document.createElement('option');
                        option.value = JSON.stringify({ location: { lat: store.Latitud, lng: store.Longitud }, name: store.Direccion, municipio: store.Municipio, barrio: store.Barrio });
                        option.textContent = `${store.Direccion} (${store.Municipio}, ${store.Barrio})`;
                        storeSelect.appendChild(option);
                    });
                }
            });
        })
        .catch(error => console.error('Error al obtener los puntos de venta:', error));
}

function openGoogleMaps(location) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
}

document.getElementById('trace-route').addEventListener('click', () => {
    const storeSelect = document.getElementById('store-select');
    const storeLocation = JSON.parse(storeSelect.value);
    if (storeLocation) {
        openGoogleMaps(storeLocation.location);
    }
});

document.getElementById('store-select').addEventListener('change', () => {
    const storeLocation = JSON.parse(document.getElementById('store-select').value);
    if (storeLocation) {
        openGoogleMaps(storeLocation.location);
    }
});

loadStores();
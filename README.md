# Atles Galaxia

Visualitzador web experimental d'estels reals i sistemes amb exoplanetes.

El projecte esta pensat per publicar-se com a web estatica amb GitHub Pages i incrustar-se a Wix amb un iframe.

## Estat actual

- Canvas 3D sense compilacio.
- Cataleg Gaia DR3 dividit en cubs/rajoles locals.
- Capa guia d'estels brillants.
- Navegacio tipus nau: yaw, pitch, roll i translacio.
- Cerca i salts a estels destacats.
- Hover amb dades basiques d'estels importants.

## Executar localment

Obre'l amb un servidor local, no directament com a fitxer HTML:

```powershell
python -m http.server 8777
```

Despres visita:

```text
http://127.0.0.1:8777/
```

Si s'obre com a `file://`, el navegador pot bloquejar la carrega de les dades Gaia.

## Publicacio a GitHub Pages

Quan el repo sigui a GitHub:

1. Ves a `Settings`.
2. Entra a `Pages`.
3. Tria `Deploy from a branch`.
4. Selecciona `main` i carpeta `/root`.
5. Desa.

La URL sera semblant a:

```text
https://<usuari>.github.io/atles-galaxia/
```


# Local Menu Images

This folder is for storing menu item images for local development.

## How to use:

1. When adding or editing a menu item, select an image from your computer
2. After submission, copy the image file to this folder (`public/images/menu/`)
3. The image will be available at the path `/images/menu/your-image-filename.jpg`

## Example:

If you select an image named `burger.jpg` in the form:
1. After submitting the form, copy `burger.jpg` to `public/images/menu/burger.jpg`
2. The image will be accessible at `/images/menu/burger.jpg`

## Important Notes:

- This approach is for local development only
- In a production environment, you would typically:
  - Upload images to a server
  - Store them in a cloud storage service
  - Serve them through a CDN
- Browser security restrictions prevent JavaScript from directly writing files
  to the file system, so manual copying is required 
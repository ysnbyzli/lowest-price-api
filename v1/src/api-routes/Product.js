const express = require("express");

const { index, create, update, remove } = require("../controller/Product");
const authenticate = require("../middlewares/authenticate");
const uploads = require("../middlewares/image");
const validate = require("../middlewares/validate");
const schemas = require("../validations/Product");

const router = express.Router();

router.route("/").get(index);
router.route("/").post(authenticate, uploads.single("image"), create);
router
  .route("/:id")
  .patch(authenticate, validate(schemas.updateValidation), update);
router.route("/:id").delete(authenticate, remove);

module.exports = router;
const httpStatus = require("http-status");

const {
  list,
  getOneUserByFilter,
  insert,
  modify,
} = require("../services/User");
const ProductService = require("../services/Product");
const {
  passwordToHash,
  generateAccessToken,
  generateRefreshToken,
  imageUploader,
} = require("../scripts/utils/helper");

const index = (req, res) => {
  list()
    .then((response) => {
      res.status(httpStatus.OK).json(response);
    })
    .catch(() =>
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Kullanıcılar listelenirken bir hata oluştu!" })
    );
};

const create = async (req, res) => {
  req.body.password = passwordToHash(req.body.password);

  const user = await getOneUserByFilter({ username: req.body.username });
  if (user)
    return res
      .status(httpStatus.CONFLICT)
      .json({ message: "Bu kullanıcı adı kullanılıyor!" });

  insert(req.body)
    .then((response) => {
      res.status(httpStatus.CREATED).json(response);
    })
    .catch(() =>
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Kullanıcı kaydedilirken beklenmedik bir hata oluştu!",
      })
    );
};

const login = (req, res) => {
  req.body.password = passwordToHash(req.body.password);

  getOneUserByFilter(req.body).then((user) => {
    if (!user)
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "Böyle bir kullanıcı bulunmamaktadır!" });

    user = {
      ...user.toObject(),
      tokens: {
        access_token: generateAccessToken(user._doc),
        refresh_token: generateRefreshToken(user._doc),
      },
    };
    delete user.password;
    res.status(httpStatus.OK).json(user);
  });
};

const update = async (req, res) => {
  let imageUrl;
  if (req.file?.path) {
    const result = await imageUploader(
      req.file.path,
      "profiles",
      `${req.user._id}_profile`
    );
    imageUrl = result.url;
  }

  const data = {
    profile_image: imageUrl,
    ...req.body,
  };

  modify({ _id: req.user._id }, data)
    .then((user) => {
      if (!user)
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "Kullanıcı bulunamadı!" });
      res.status(httpStatus.OK).json(user);
    })
    .catch(() =>
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Kullanıcı güncellenirken bir hata oluştu" })
    );
};

const getUserProductList = (req, res) => {
  return ProductService.list({ user_id: req.user._id })
    .then((response) => {
      res.status(httpStatus.OK).json(response);
    })
    .catch(() =>
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Ürünler listelenirken bir hata oluştu!" })
    );
};

module.exports = {
  index,
  create,
  login,
  update,
  getUserProductList,
};

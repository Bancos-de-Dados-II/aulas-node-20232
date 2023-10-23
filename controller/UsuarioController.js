const Usuario = require('../model/Usuario');
const client = require('../database/redis');

module.exports.listarUsuarios = async function (req, res) {
  const usuarios = await Usuario.findAll();
  res.status(200).send(usuarios);
};

module.exports.buscarPorEmail = async function (req, res) {
  //Buscar a chave no redis
  const retornoRedis = await client.get(req.params.email);

  if (retornoRedis) {
    //Cache hit
    console.log('Veio de Redis');
    res.status(200).send(retornoRedis);
  } else {
    //Cache miss
    const usuario = await Usuario.findByPk(req.params.email);

    if (usuario) {
      //Salvar no redis com tempo de vida de 1 hora
      await client.set(req.params.email, JSON.stringify(usuario),{EX: 3600});
      console.log('Veio do Postgres');
      res.status(200).send(usuario);
    } else {
      res.status(404).send('Usuário não encontrado');
    }
  }

};

module.exports.salvarUsuario = async function (req, res) {
  const usuario = Usuario.build(req.body);
  try {
    await usuario.save();
    res.status(201).send('Salvo');
  } catch {
    res.status(400).send('Falha ao salvar');
  }
};

module.exports.deletarUsuario = async function (req, res) {
  try {
    const deletados = await Usuario.destroy({
      where: { email: req.params.email }
    });
    if (deletados > 0) {
      res.status(200).send('Usuário removido');
    } else {
      res.status(404).send('Usuário não encontrado');
    }
  } catch (error) {
    res.status(400).send('Falha ao deletar');
  }
};

module.exports.atualizarUsuario = async function (req, res) {
  try {
    const atualizados = await Usuario.update(
      req.body, { where: { email: req.params.email } });
    if (atualizados > 0) {
      res.status(200).send('Usuário atualizado');
    } else {
      res.status(404).send('Usuário não encontrado');
    }
  } catch (error) {
    res.status(400).send('Falha ao atualizar');
  }
};
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Commande pour ajouter la colonne 'studentOrigin'
    await queryInterface.addColumn("Registrations", "studentOrigin", {
      type: Sequelize.ENUM("FPHM", "Autre"), // Utilise ENUM comme dans ton modèle
      allowNull: true, // Autorise les valeurs nulles
    });
    // Commande pour ajouter la colonne 'studentOriginOther'
    await queryInterface.addColumn("Registrations", "studentOriginOther", {
      type: Sequelize.STRING, // Type chaîne de caractères
      allowNull: true, // Autorise les valeurs nulles
    });
  },

  async down(queryInterface, Sequelize) {
    // Commandes pour annuler les changements (si tu dois revenir en arrière)
    await queryInterface.removeColumn("Registrations", "studentOrigin");
    await queryInterface.removeColumn("Registrations", "studentOriginOther");
  },
};

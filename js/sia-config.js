window.SIA_CONFIG = (function () {
  'use strict';

  var INSTALLER = {
    url: '',
    fileName: '',
    version: '',
    releaseDate: '',
    fileSize: '',
    platform: 'Windows',
    osRequirements: '',
    docsUrl: 'https://www.sansol.in/sia',
    checksum: ''
  };

  var POC = {
    endpoint: '',
    method: 'POST'
  };

  var DEMO = {
    endpoint: '/sendquote',
    method: 'POST',
    successRedirect: '/thanks'
  };

  var CONTACT = {
    email: 'info@sansol.in',
    phone: '+91-11-4222 0301'
  };

  return {
    INSTALLER: INSTALLER,
    POC: POC,
    DEMO: DEMO,
    CONTACT: CONTACT
  };
})();
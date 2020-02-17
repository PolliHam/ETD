sap.ui.define(["sap/secmon/ui/m/commons/EtdController"], function (EtdController) {
	"use strict";

	return EtdController.extend("sap.secmon.ui.userNg.App", {
		onInit: function () {
			this.applyCozyCompact();
		}
	});
});
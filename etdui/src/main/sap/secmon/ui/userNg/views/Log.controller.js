sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/Sorter"], function (Controller, Sorter) {
	"use strict";

	return Controller.extend("sap.secmon.ui.userNg.views.Log", {
		onInit: function () {

			this._oLogTable = this.getView().byId("userNg-log-table");
			this._oLogTemplate = this._oLogTable.getItems()[0];
			this._oLogTable.removeItem(this._oLogTemplate);

			this._oLogTable.bindItems({
				path: 'log>/PseudonymProtocol',
				template: this._oLogTemplate,
				sorter: new Sorter({ path: 'Timestamp', descending: true })
			});
		},

		onLogTableUpdate: function (oEvent) {
			var iTotal = oEvent.getParameter("total");
			this.getView().fireEvent("countChange", { count: iTotal });
		},

		onLogShowViewSettings : function(oEvent) {
			if (!this._oSettingsDialog) {
				this._oSettingsDialog = sap.ui.xmlfragment("sap.secmon.ui.userNg.fragments.ProtocolSettingsDialog", this);
				this._oSettingsDialog.setSelectedSortItem("Timestamp");
				this._oSettingsDialog.setSortDescending(true);
				this._oSettingsDialog.attachConfirm(this.onLogConfirmViewSettings.bind(this));
				this.getView().addDependent(this._oSettingsDialog);
			}
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSettingsDialog);

			this._oSettingsDialog.open();
		},

		onLogConfirmViewSettings : function(oEvent) {
			var oParameters = oEvent.getParameters();
			var oSorter, sPath, sValue;
			var aFilters = [];
			if (oParameters.sortItem) {
				oSorter = new sap.ui.model.Sorter(oParameters.sortItem.getKey(), oParameters.sortDescending);
			}

			if (oParameters.filterItems) {
				oParameters.filterItems.forEach(function(oItem) {
					sPath = oItem.getParent().getKey();
					sValue = oItem.getKey();
					aFilters.push(new sap.ui.model.Filter({
						path : sPath,
						operator : sap.ui.model.FilterOperator.EQ,
						value1 : sValue
					}));
				});
			}

			this._oLogTable.bindItems({
				path: 'log>/PseudonymProtocol',
				template: this._oLogTemplate,
				sorter: oSorter,
				filters: aFilters
			});
		}
	});
});
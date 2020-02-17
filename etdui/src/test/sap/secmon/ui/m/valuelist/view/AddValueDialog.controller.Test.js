describe("AddValueDialog.controller Tests", function(){
	jQuery.sap.require({
		modName : "sap.secmon.ui.m.valuelist.view.AddValueDialog",
		type : "controller"
	});
	jQuery.sap.require("sap.secmon.ui.m.namespace.util.ODataErrorHandler");
	
	var libUnderTest;
	var view, dialog, parentView, parentController, messageBox, messageToast, errorHandler, bindingContext;
	afterEach(function() {
	});
	beforeEach(function() {
		 libUnderTest = sap.ui.controller("sap.secmon.ui.m.valuelist.view.AddValueDialog");
		 view = jasmine.createSpyObj("view", ["setModel", "byId", "addStyleClass", "getModel", "getController"]);
		 dialog = jasmine.createSpyObj("dialog", ["setModel", "open", "close", "focus", "getModel", "getParent"]);
		 
		 parentView = jasmine.createSpyObj("parentView", ["getId", "addDependent", "getModel", "byId", "getBindingContext", "getController"]);
		 libUnderTest.oParentView = parentView; 
		 
		 parentController = jasmine.createSpyObj("parentController", ["isResetNeeded", "getResetDetails", "triggerReset"]);
		 parentController.ResetData = {resetRelevant : true, resetAllowed : null, totalAlertCount : 2};
		 
		 bindingContext = jasmine.createSpyObj("bindingContext", ["getProperty"]);
		 spyOn(libUnderTest, "getView").and.returnValue(view);
		 spyOn(libUnderTest, "fnSuccessCallback");

		 //dialog.getParent.and.returnValue(view);
		 messageBox = spyOn(sap.m.MessageBox, "show");
		 messageToast = spyOn(sap.m.MessageToast, "show");
		 errorHandler = spyOn(sap.secmon.ui.m.namespace.util.ODataErrorHandler, "showAlert");
	});
	it("openDialog Test", function() {
		libUnderTest.oDialog = dialog;
		var namespaceSelect = jasmine.createSpyObj("namespaceSelect", ["removeItem", "bindAggregation"]);
		parentView.byId.and.returnValue(namespaceSelect);
		parentView.getBindingContext.and.returnValue(bindingContext);
		var callback = function() {};
		libUnderTest.openDialog("2b", parentView, callback);
		expect(libUnderTest.fnSuccessCallback).toBe(callback);
		expect(dialog.setModel).toHaveBeenCalled();
		expect(dialog.open).toHaveBeenCalled();
	});
	it("openDialog Test", function() {
		libUnderTest.oDialog = dialog;
		var namespaceSelect = jasmine.createSpyObj("namespaceSelect", ["removeItem", "bindAggregation"]);
		namespaceSelect.removeItem.and.returnValue(null);
		parentView.byId.and.returnValue(namespaceSelect);
		parentView.getBindingContext.and.returnValue(bindingContext);
		var callback = function() {};
		libUnderTest.openDialog("2b", parentView, callback);
		expect(libUnderTest.fnSuccessCallback).toBe(callback);
		expect(dialog.setModel).toHaveBeenCalled();
		expect(dialog.open).toHaveBeenCalled();
		expect(namespaceSelect.bindAggregation).not.toHaveBeenCalled();
	});
	it("onDialogClose", function() {
		libUnderTest.oDialog = dialog;
		libUnderTest.onDialogClose();
		expect(dialog.close).toHaveBeenCalled();
	});
	xit("onAddValue", function() {
		var confirm = spyOn( sap.m.MessageBox, "confirm");
		libUnderTest.oDialog = dialog;
		var oModel = jasmine.createSpyObj("model", ["getData"]);
		var controller = jasmine.createSpyObj("controller", ["isResetNeeded", "getResetDetails", "triggerReset"]);
		//var resetData = jasmine.createSpyObj("resetData", ["rese"])
		controller.ResetData = {resetRelevant : true, resetAllowed : null, totalAlertCount : 2};
		dialog.getModel.and.returnValue(oModel);
		view.getController.and.returnValue({isResetNeeded : true})
		libUnderTest.onAddValue.call(libUnderTest);
	});
});
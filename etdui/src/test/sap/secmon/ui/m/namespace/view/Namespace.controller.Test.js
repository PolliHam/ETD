describe("Namespaces.controller Tests", function(){
	jQuery.sap.require({
		modName : "sap.secmon.ui.m.namespace.view.Namespaces",
		type : "controller"
	});
	
	var libUnderTest;
	var view, dialog, parentView, messageBox, messageToast, errorHandler;
	afterEach(function() {
	});
	beforeEach(function() {
		
		 libUnderTest = sap.ui.controller("sap.secmon.ui.m.namespace.view.Namespaces");
		 view = jasmine.createSpyObj("view", ["setModel", "byId", "addStyleClass", "getModel"]);
		 dialog = jasmine.createSpyObj("dialog", ["setModel", "open", "close", "focus", "getModel", "getParent"]);
		 parentView = jasmine.createSpyObj("parentView", ["getId", "addDependent", "getModel"]);
		 spyOn(libUnderTest, "getView").and.returnValue(view);
		 dialog.getParent.and.returnValue(view);
		 messageBox = spyOn(sap.m.MessageBox, "show");
		 messageToast = spyOn(sap.m.MessageToast, "show");
		 errorHandler = spyOn(sap.secmon.ui.m.namespace.util.ODataErrorHandler, "showAlert");
	});
	it("onInit Test", function() {
		libUnderTest.onInit();
		expect(view.addStyleClass).toHaveBeenCalledWith("sapUiSizeCompact");
		expect(libUnderTest.oCommons).not.toBeNull();
	});
	it("onInit Test for not touch", function() {
		spyOn(jQuery.support, "touch").and.returnValue(false);
		expect(view.addStyleClass).not.toHaveBeenCalled();
	});
	it("onAddNamespace", function() {
		
		libUnderTest.oCreateNamespaceController = jasmine.createSpyObj("createNamespaceController", ["openDialog"]);
		view.byId.and.returnValue(dialog);
		libUnderTest.onAddNamespace();
		expect(dialog.focus).toHaveBeenCalled();
	});
	it("onDeleteNamespace", function() {
		var oEvent = jasmine.createSpyObj("oEvent", ["getSource"]);
		var source = jasmine.createSpyObj("source", ["getBindingContext"]);
		var bindingContext = jasmine.createSpyObj("bindingContext", ["getObject"]);
		var i18nModel = jasmine.createSpyObj("i18nModel", ["getProperty"]);
		view.getModel.and.returnValue(i18nModel);
		oEvent.getSource.and.returnValue(source);
		source.getBindingContext.and.returnValue(bindingContext);
		bindingContext.getObject.and.returnValue({Id : '2b', NameSpace : "http://namespace"});
		libUnderTest.onDeleteNamespace(oEvent);
		expect(messageBox).toHaveBeenCalled();
	});
});
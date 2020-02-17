describe("CreateNamespaceDialog.controller Tests", function(){
	jQuery.sap.require({
		modName : "sap.secmon.ui.m.namespace.view.CreateNamespaceDialog",
		type : "controller"
	});
	
	var libUnderTest;
	var view, dialog, parentView, messageBox, messageToast, errorHandler, namespaceModel, localModel, i18nModel;
	afterEach(function() {
	});
	beforeEach(function() {
		libUnderTest = sap.ui.controller("sap.secmon.ui.m.namespace.view.CreateNamespaceDialog");
		view = jasmine.createSpyObj("view", ["setModel", "byId"]);
		dialog = jasmine.createSpyObj("dialog", ["setModel", "open", "close", "focus", "getModel", "getParent"]);
		parentView = jasmine.createSpyObj("parentView", ["getId", "addDependent", "getModel"]);
		spyOn(libUnderTest, "getView").and.returnValue(view);
		dialog.getParent.and.returnValue(view);
		messageBox = spyOn(sap.m.MessageBox, "alert");
		messageToast = spyOn(sap.m.MessageToast, "show");
		errorHandler = spyOn(sap.secmon.ui.m.namespace.util.ODataErrorHandler, "showAlert");
		namespaceModel = jasmine.createSpyObj("namespaceModel", ["create", "setHeaders","getProperty"]);
		localModel = jasmine.createSpyObj("localModel",["getData","getProperty", "setProperty"]);
		i18nModel = jasmine.createSpyObj("i18nModel", ["getProperty"]);
	});
	
	it("openDialog with no dialog", function() {
		var callback = function() {};
		spyOn(jQuery.sap, "syncStyleClass");
		var xmlfragment = spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
		libUnderTest.openDialog(parentView,  callback);
		expect(libUnderTest.fnSuccessCallback).toBe(callback);
		expect(libUnderTest.oDialog).toBe(dialog);
		expect(dialog.open).toHaveBeenCalled();
		expect(parentView.addDependent).toHaveBeenCalledWith(dialog);
		expect(dialog.setModel).toHaveBeenCalled();
		expect(xmlfragment).toHaveBeenCalled();
	});
	it("openDialog with existing dialog", function() {
		var callback = function() {};
		spyOn(jQuery.sap, "syncStyleClass");
		var xmlfragment = spyOn(sap.ui, "xmlfragment").and.returnValue(dialog);
		libUnderTest.oDialog = dialog;
		libUnderTest.openDialog(parentView,  callback);
		expect(libUnderTest.fnSuccessCallback).toBe(callback);
		expect(libUnderTest.oDialog).toBe(dialog);
		expect(dialog.open).toHaveBeenCalled();
		expect(parentView.addDependent).not.toHaveBeenCalledWith(dialog);
		expect(dialog.setModel).toHaveBeenCalled();
		expect(xmlfragment).not.toHaveBeenCalled();	
	});
	
	it("onCreate with correct namespace", function() {
		spyOn(libUnderTest, "checkNameSpace").and.returnValue(true);
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : "http://namespace"})
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).toHaveBeenCalled();
		expect(messageBox).not.toHaveBeenCalled();
	});
	it("onCreate with wrong namespace", function() {
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : "https://namespace"})
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).not.toHaveBeenCalled();
	});
	it("onCreate with empty namespace", function() {
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : null})
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).not.toHaveBeenCalled();
	});
	it("onCreate with undefined namespace", function() {
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : null})
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).not.toHaveBeenCalled();
	});
	it("onCreate with correct namespace and success", function() {
		spyOn(libUnderTest, "checkNameSpace").and.returnValue(true);
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : "http://namespace"});
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).toHaveBeenCalled();
		expect(messageBox).not.toHaveBeenCalled();
		expect(namespaceModel.create.calls.argsFor(0)[0]).toEqual("/SystemNamespace");
		expect(namespaceModel.create.calls.argsFor(0)[1].NameSpace).toEqual("http://namespace");
		expect(namespaceModel.create.calls.argsFor(0)[2].hasOwnProperty("success")).toBeTruthy();
		namespaceModel.create.calls.argsFor(0)[2].success();
		expect(messageToast).toHaveBeenCalled();
		expect(dialog.close).toHaveBeenCalled();
	});
	it("onCreate with correct namespace and error", function() {
		spyOn(libUnderTest, "checkNameSpace").and.returnValue(true);
		parentView.getModel.and.returnValue(i18nModel);
		localModel.getData.and.returnValue({NameSpace : "http://namespace"});
		dialog.getModel.and.returnValue(localModel);
		libUnderTest.oDialog = dialog;
		libUnderTest.oParentView = parentView;
		parentView.getModel.and.returnValue(namespaceModel);
		libUnderTest.onCreate();
		expect(dialog.focus).toHaveBeenCalled();
		expect(namespaceModel.create).toHaveBeenCalled();
		expect(messageBox).not.toHaveBeenCalled();
		expect(namespaceModel.create.calls.argsFor(0)[0]).toEqual("/SystemNamespace");
		expect(namespaceModel.create.calls.argsFor(0)[1].NameSpace).toEqual("http://namespace");
		expect(namespaceModel.create.calls.argsFor(0)[2].hasOwnProperty("error")).toBeTruthy();
		namespaceModel.create.calls.argsFor(0)[2].error({response : "error"});
		expect(messageToast).not.toHaveBeenCalled();
		expect(dialog.close).not.toHaveBeenCalled();
		expect(errorHandler).toHaveBeenCalled();
	});
		
});

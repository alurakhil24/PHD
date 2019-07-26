/*eslint-disable */
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { withSocket } from './socket';
import cusrorImage from './resources/cursor.png';
import CreateTaskNode from "./component/CreateTaskNode";
import { Checkbox } from 'antd';
import { notification } from 'antd';
import "./common.css";
import "./mxgraph.css";
import {
  mxGraph,
  mxParallelEdgeLayout,
  mxConstants,
  mxEdgeStyle,
  mxLayoutManager,
  mxGraphHandler,
  mxGuide,
  mxEdgeHandler,
  mxCell,
  mxGeometry,
  mxRubberband,
  mxDragSource,
  mxKeyHandler,
  mxCodec,
  mxClient,
  mxConnectionHandler,
  mxUtils,
  mxToolbar,
  mxEvent,
  mxImage,
  mxConstraintHandler,
  mxFastOrganicLayout,
  mxUndoManager,
  mxObjectCodec,
  mxHierarchicalLayout,
  mxConnectionConstraint,
  mxCellState,
  mxPoint,
  mxGraphModel,
  mxPerimeter,
  mxCompactTreeLayout,
  mxCellOverlay
} from "mxgraph-js";
import LiveShare from './component/LiveShare';
import LiveShareConfirmation from './component/LiveShareConfirmation';
import imgHLine from './resources/Horizontal Line.svg';
import imgVLine from './resources/Vertical Line.svg';
import imgBox from './resources/Box.svg';
import imgEllipse from './resources/Ellipse.svg';
import imgTriangle from './resources/Triangle.svg';

// xml-< json
class mxCellAttributeChange {
  // constructor
  constructor(cell, attribute, value) {
    this.cell = cell;
    this.attribute = attribute;
    this.value = value;
    this.previous = value;
  }
  // Method
  execute() {
    if (this.cell != null) {
      var tmp = this.cell.getAttribute(this.attribute);

      if (this.previous == null) {
        this.cell.value.removeAttribute(this.attribute);
      } else {
        this.cell.setAttribute(this.attribute, this.previous);
      }

      this.previous = tmp;
    }
  }
}
class JsonCodec extends mxObjectCodec {
  constructor() {
    super(value => { });
  }
  encode(value) {
    const xmlDoc = mxUtils.createXmlDocument();
    const newObject = xmlDoc.createElement("TaskObject");
    for (let prop in value) {
      newObject.setAttribute(prop, value[prop]);
    }
    return newObject;
  }
  decode(model) {
    return Object.keys(model.cells)
      .map(iCell => {
        const currentCell = model.getCell(iCell);
        return currentCell.value !== undefined ? currentCell : null;
      })
      .filter(item => item !== null);
  }
}

class mxGraphGridAreaEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      graph: {},
      layout: {},
      json: "",
      dragElt: null,
      createVisile: false,
      currentNode: null,
      currentTask: "",
      width: window.innerWidth,
      height: window.innerHeight,
      confirmLiveShare: false,
    };


    this.LoadGraph = this.LoadGraph.bind(this);
  }

  handleClientCursors = () => {
    this.props.socket.on('clientCursorMoved', (mousePosition) => {
      console.log('client listened')
      console.log(mousePosition);

      let clientCursor = document.getElementById(`div${mousePosition.clientId}`);
      if (clientCursor) {

        clientCursor.setAttribute("style", `background: red;left: ${mousePosition.x * this.state.width}px ; top:${mousePosition.y * this.state.height}px; position: absolute`);

        // clientCursor.left = mousePosition.x;
        // clientCursor.top = mousePosition.y;
      }
    });
  }

  componentWillUnmount() {
    // window.removeEventListener('resize', this.updateWindowDimensions);
  }
  componentDidMount = () => {
    this.LoadGraph();

    if (this.props.socket) {

      this.props.socket.emit('storeClientInfo', {
        customId: this.props.userName,
        clientId: this.props.socket.id,
      }) // change 'red' to this.state.color


      this.props.socket.on('newclientAdded', ({ clients, addedClient }) => {
        if (addedClient.customId !== this.props.userName) {
          const args = {
            message: `${addedClient.customId} has joined the Live Share Session`,
            duration: 1,
          };
          notification.open(args);
        }
        for (let i = 0; i < clients.length; i++) {
          let clientInfo = clients[i];
          if (this.props.socket.id !== clientInfo.clientId) {

            let found = document.getElementById(clientInfo.clientId);
            if (!found) {
              let root = document.querySelector(".App");
              let cursorParent = document.createElement('div');
              cursorParent.setAttribute('id', `${clientInfo.clientId}`)
              cursorParent.setAttribute('value', `${clientInfo.id}`)

              cursorParent.innerHTML = clientInfo.customId;
              let cursor = document.createElement('img');
              cursor.setAttribute("id", clientInfo.clientId);
              cursor.setAttribute("src", cusrorImage);
              cursor.setAttribute('position', 'absolute');
              cursor.setAttribute("width", '20px');
              cursor.setAttribute("height", '20px');
              cursor.setAttribute("style", `background:blue;z-index: 20; position: absolute`);
              cursorParent.appendChild(cursor);
              root.appendChild(cursorParent);
              cursor.innerHTML = clientInfo.clientId;

            }
          }
        }
        this.setState({
          clients,
        });
      });

      this.props.socket.on('clientDisconnected', (disconnectedClient) => {
        console.log('inside the disconnect');
        const app = document.querySelector('.App');
        const clientToBeRemoved = document.querySelector(`#${disconnectedClient.clientId}`);
        if (clientToBeRemoved) {
          app.removeChild(clientToBeRemoved);
          const args = {
            message: `${disconnectedClient.customId} has been disconnected`,
            duration: 1,
          };
          notification.open(args);
          const clients = this.state.clients.filter(client => client.clientId !== disconnectedClient.clientId);
          this.setState({
            clients,
          })
        }
      });

      this.props.socket.on('shapeDroppedOnClient', this.listenToShapeDroppedEvent);

      this.addDocumentListeners();
      this.listenForClientSocketEvents();
      document.getElementById("clientId").innerHTML = this.state.customId;
      window.addEventListener('resize', this.updateWindowDimensions);
    }

  }

  updateWindowDimensions = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    })

  }
  listenForClientSocketEvents = () => {
    this.handleClientCursors();
    this.handleClientMouseClick();
    this.handleJoinRequest();
  }
  handleClientMouseClick = () => {
    this.props.socket.on('clientMouseClick', (mousePosition) => {
      // console.log('client listened')
      // console.log(mousePosition);
      // let clientCursor = document.getElementById(mousePosition.clientId);
      // if (clientCursor) {

      //   clientCursor.setAttribute("style", `background:blue; left: ${mousePosition.x}px ; top:${mousePosition.y}px; position: absolute`);

      //   // clientCursor.left = mousePosition.x;
      //   // clientCursor.top = mousePosition.y;
      // }
    });
  }

  handleClick = () => {

  }

  listenToShapeDroppedEvent = (data) => {
    if (data) {
      //console.log('shape dropped event ' +cell.id);
      let isSameShapeExists = false;
      const { shape, clientId } = data;
      if (this.props.socket.id !== clientId)
        this.createShape(shape);
    }
  }

  addDocumentListeners = () => {
    document.getElementById("root").addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("click", this.handleClick);
  }
  //  渲染json为graph
  renderJSON = (dataModel, graph) => {
    const jsonEncoder = new JsonCodec();
    let vertices = {};
    const parent = graph.getDefaultParent();
    graph.getModel().beginUpdate(); // Adds cells to the model in a single step
    try {
      dataModel &&
        dataModel.graph.map(node => {
          if (node.value) {
            if (typeof node.value === "object") {
              const xmlNode = jsonEncoder.encode(node.value);
              vertices[node.id] = graph.insertVertex(
                parent,
                null,
                xmlNode,
                node.geometry.x,
                node.geometry.y,
                node.geometry.width,
                node.geometry.height,
                node.style
              );
            } else if (node.value === "Edge") {
              graph.insertEdge(
                parent,
                null,
                "Edge",
                vertices[node.source],
                vertices[node.target],
                node.style
              );
            }
          }
        });
    } finally {
      graph.getModel().endUpdate(); // Updates the display
    }
  };

  getJsonModel = graph => {
    const encoder = new JsonCodec();
    const jsonModel = encoder.decode(graph.getModel());
    return {
      graph: jsonModel
    };
  };

  stringifyWithoutCircular = json => {
    return JSON.stringify(
      json,
      (key, value) => {
        if (
          (key === "parent" || key == "source" || key == "target") &&
          value !== null
        ) {
          return value.id;
        } else if (key === "value" && value !== null && value.localName) {
          let results = {};
          Object.keys(value.attributes).forEach(attrKey => {
            const attribute = value.attributes[attrKey];
            results[attribute.nodeName] = attribute.nodeValue;
          });
          return results;
        }
        return value;
      },
      4
    );
  };
  addOverlays = (graph, cell) => {
    var overlay = new mxCellOverlay(
      new mxImage(
        "https://uploads.codesandbox.io/uploads/user/4bf4b6b3-3aa9-4999-8b70-bbc1b287a968/jEU_-add.png",
        16,
        16
      ),
      "load more"
    );
    console.log("overlay");
    overlay.cursor = "hand";
    overlay.align = mxConstants.ALIGN_CENTER;
    overlay.offset = new mxPoint(0, 10);
    overlay.addListener(
      mxEvent.CLICK,
      mxUtils.bind(this, function (sender, evt) {
        console.log("load more");
        // addChild(graph, cell);
      })
    );

    graph.addCellOverlay(cell, overlay);
  };
  handleCancel = () => {
    this.setState({ createVisile: false });
    this.state.graph.removeCells([this.state.currentNode]);
  };
  handleConfirm = fields => {
    const { graph } = this.state;
    const cell = graph.getSelectionCell();
    this.applyHandler(graph, cell, "text", fields.taskName);
    this.applyHandler(graph, cell, "desc", fields.taskDesc);
    cell.setId(fields.id || 100);
    this.setState({ createVisile: false });
  };
  applyHandler = (graph, cell, name, newValue) => {
    graph.getModel().beginUpdate();
    try {
      const edit = new mxCellAttributeChange(cell, name, newValue);
      // console.log(edit)
      graph.getModel().execute(edit);
      // graph.updateCellSize(cell);
    } finally {
      graph.getModel().endUpdate();
    }
  };
  graphF = evt => {
    const { graph } = this.state;
    var x = mxEvent.getClientX(evt);
    var y = mxEvent.getClientY(evt);
    var elt = document.elementFromPoint(x, y);
    if (mxUtils.isAncestorNode(graph.container, elt)) {
      return graph;
    }
    return null;
  };
  loadGlobalSetting = () => {
    // Enable alignment lines to help locate
    mxGraphHandler.prototype.guidesEnabled = true;
    // Alt disables guides
    mxGuide.prototype.isEnabledForEvent = function (evt) {
      return !mxEvent.isAltDown(evt);
    };
    // Specifies if waypoints should snap to the routing centers of terminals
    mxEdgeHandler.prototype.snapToTerminals = true;
    mxConstraintHandler.prototype.pointImage = new mxImage(
      "https://uploads.codesandbox.io/uploads/user/4bf4b6b3-3aa9-4999-8b70-bbc1b287a968/-q_3-point.gif",
      5,
      5
    );
  };
  getEditPreview = () => {
    var dragElt = document.createElement("div");
    dragElt.style.border = "dashed black 1px";
    dragElt.style.width = "120px";
    dragElt.style.height = "40px";
    return dragElt;
  };
  createDragElement = () => {
    const { graph } = this.state;
    const tasksDrag = ReactDOM.findDOMNode(
      this.refs.mxSidebar
    ).querySelectorAll(".task");
    Array.prototype.slice.call(tasksDrag).forEach(ele => {
      const value = ele.getAttribute("data-value");
      let style = this.getShapeStyle(value);
      let ds = mxUtils.makeDraggable(
        ele,
        this.graphF,
        (graph, evt, target, x, y) =>
          this.funct(graph, evt, target, x, y, style, value),
        this.dragElt,
        null,
        null,
        graph.autoscroll,
        true
      );
      ds.isGuidesEnabled = function () {
        return graph.graphHandler.guidesEnabled;
      };
      ds.createDragElement = mxDragSource.prototype.createDragElement;
    });
  };

  getShapeStyle = (shapeType) => {
    let style = '';
    switch (shapeType) {
      case 'triangle':
        style = 'shape=triangle;fillColor=White;direction=north;strokeWidth=1;';
        break;
      case 'rectangle':
        style = 'shape=rectangle;fillColor=White;strokeWidth=1;';
        break;
      case 'ellipse':
        style = 'shape=ellipse;perimeter=ellipsePerimeter;direction=north;fillColor=White;strokeWidth=1;';
        break;
      case 'line':
        style = 'shape=line;fillColor=White;strokeWidth=1;';
        break;
      default:
        style = 'shape=triangle;fillColor=White;direction=north;strokeWidth=1;';
    }
    return style;
  }

  selectionChanged = (graph, value) => {
    console.log("visible");
    this.setState({
      createVisile: true,
      currentNode: graph.getSelectionCell(),
      currentTask: value
    });
  };
  createPopupMenu = (graph, menu, cell, evt) => {
    if (cell) {
      if (cell.edge === true) {
        menu.addItem("Delete connection", null, function () {
          graph.removeCells([cell]);
          mxEvent.consume(evt);
        });
      } else {
        menu.addItem("Edit child node", null, function () {
          // mxUtils.alert('Edit child node: ');
          // selectionChanged(graph)
        });
        menu.addItem("Delete child node", null, function () {
          graph.removeCells([cell]);
          mxEvent.consume(evt);
        });
      }
    }
  };
  setGraphSetting = () => {
    const { graph } = this.state;
    const that = this;
    graph.gridSize = 30;
    graph.setPanning(true);
    graph.setTooltips(true);
    graph.setConnectable(true);
    graph.setCellsEditable(true);
    graph.setEnabled(true);
    // Enables HTML labels
    graph.setHtmlLabels(true);
    // 居中缩放
    graph.centerZoom = true;
    // Autosize labels on insert where autosize=1
    graph.autoSizeCellsOnAdd = true;

    const keyHandler = new mxKeyHandler(graph);
    keyHandler.bindKey(46, function (evt) {
      if (graph.isEnabled()) {
        const currentNode = graph.getSelectionCell();
        if (currentNode.edge === true) {
          graph.removeCells([currentNode]);
        }
      }
    });
    keyHandler.bindKey(37, function () {
      console.log(37);
    });
    new mxRubberband(graph);
    graph.getTooltipForCell = function (cell) {
      return cell.getAttribute("desc");
    };
    var style = [];
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_FILLCOLOR] = "#C3D9FF";
    style[mxConstants.STYLE_STROKECOLOR] = "#6482B9";
    style[mxConstants.STYLE_FONTCOLOR] = "#774400";
    style[mxConstants.HANDLE_FILLCOLOR] = "#80c6ee";
    graph.getStylesheet().putDefaultVertexStyle(style);
    style = [];
    style[mxConstants.STYLE_STROKECOLOR] = "#f90";
    style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CONNECTOR;
    style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
    style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
    style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
    style[mxConstants.STYLE_FONTSIZE] = "10";
    style[mxConstants.VALID_COLOR] = "#27bf81";

    graph.getStylesheet().putDefaultEdgeStyle(style);
    graph.popupMenuHandler.factoryMethod = function (menu, cell, evt) {
      return that.createPopupMenu(graph, menu, cell, evt);
    };
    graph.convertValueToString = function (cell) {
      if (
        mxUtils.isNode(cell.value) &&
        cell.value.nodeName.toLowerCase() == "taskobject"
      ) {
        // Returns a DOM for the label
        var div = document.createElement("div");
        div.setAttribute("class", "taskWrapper");
        div.innerHTML = `<span class='taskTitle'>${cell.getAttribute(
          "text",
          ""
        )}</span>`;
        mxUtils.br(div);

        var p = document.createElement("p");
        p.setAttribute("class", "taskName");
        p.innerHTML = cell.getAttribute("label");
        div.appendChild(p);

        return div;
      }
      return "";
    };
  };

  funct = (graph, evt, target, x, y, style, shapeType, selection = true) => {
    var doc = mxUtils.createXmlDocument();
    var obj = doc.createElement("TaskObject");
    obj.setAttribute("label", ' ');
    obj.setAttribute("text", "");
    obj.setAttribute("desc", "");

    var parent = graph.getDefaultParent();

    let cell = graph.insertVertex(
      parent,
      target,
      obj,
      x,
      y,
      150,
      60,
      style
    );
    cell.shapeType = shapeType;
    // this.addOverlays(graph, cell, true);
    graph.setSelectionCell(cell);

    if (selection)
      this.selectionChanged(graph, style);
    // if (cells != null && cells.length > 0)
    // {
    // 	graph.scrollCellToVisible(cells[0]);
    // 	graph.setSelectionCells(cells);
    // }
  };
  setLayoutSetting = layout => {
    layout.parallelEdgeSpacing = 10;
    layout.useBoundingBox = false;
    layout.edgeRouting = false;
    layout.levelDistance = 60;
    layout.nodeDistance = 16;
    layout.parallelEdgeSpacing = 10;
    layout.isVertexMovable = function (cell) {
      return true;
    };
    layout.localEdgeProcessing = function (node) {
      console.log(node);
    };
  };
  selectionChange = (sender, evt) => {
    // console.log(sender)
  };
  settingConnection = () => {
    const { graph } = this.state;
    mxConstraintHandler.prototype.intersects = function (
      icon,
      point,
      source,
      existingEdge
    ) {
      return !source || existingEdge || mxUtils.intersects(icon.bounds, point);
    };

    var mxConnectionHandlerUpdateEdgeState =
      mxConnectionHandler.prototype.updateEdgeState;
    mxConnectionHandler.prototype.updateEdgeState = function (pt, constraint) {
      if (pt != null && this.previous != null) {
        var constraints = this.graph.getAllConnectionConstraints(this.previous);
        var nearestConstraint = null;
        var dist = null;

        for (var i = 0; i < constraints.length; i++) {
          var cp = this.graph.getConnectionPoint(this.previous, constraints[i]);

          if (cp != null) {
            var tmp =
              (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y);

            if (dist == null || tmp < dist) {
              nearestConstraint = constraints[i];
              dist = tmp;
            }
          }
        }

        if (nearestConstraint != null) {
          this.sourceConstraint = nearestConstraint;
        }

        // In case the edge style must be changed during the preview:
        // this.edgeState.style['edgeStyle'] = 'orthogonalEdgeStyle';
        // And to use the new edge style in the new edge inserted into the graph,
        // update the cell style as follows:
        //this.edgeState.cell.style = mxUtils.setStyle(this.edgeState.cell.style, 'edgeStyle', this.edgeState.style['edgeStyle']);
      }

      mxConnectionHandlerUpdateEdgeState.apply(this, arguments);
    };

    if (graph.connectionHandler.connectImage == null) {
      graph.connectionHandler.isConnectableCell = function (cell) {
        return false;
      };
      mxEdgeHandler.prototype.isConnectableCell = function (cell) {
        return graph.connectionHandler.isConnectableCell(cell);
      };
    }

    graph.getAllConnectionConstraints = function (terminal) {
      if (terminal != null && this.model.isVertex(terminal.cell)) {
        return [
          new mxConnectionConstraint(new mxPoint(0.5, 0), true),
          new mxConnectionConstraint(new mxPoint(0, 0.5), true),
          new mxConnectionConstraint(new mxPoint(1, 0.5), true),
          new mxConnectionConstraint(new mxPoint(0.5, 1), true)
        ];
      }
      return null;
    };

    // Connect preview
    graph.connectionHandler.createEdgeState = function (me) {
      var edge = graph.createEdge(
        null,
        null,
        "Edge",
        null,
        null,
        "edgeStyle=orthogonalEdgeStyle"
      );

      return new mxCellState(
        this.graph.view,
        edge,
        this.graph.getCellStyle(edge)
      );
    };
  };
  initToolbar = () => {
    const that = this;
    const { graph, layout } = this.state;
    // 放大按钮
    var toolbar = ReactDOM.findDOMNode(this.refs.toolbar);
    toolbar.appendChild(
      mxUtils.button("zoom(+)", function (evt) {
        graph.zoomIn();
      })
    );
    // 缩小按钮
    toolbar.appendChild(
      mxUtils.button("zoom(-)", function (evt) {
        graph.zoomOut();
      })
    );
    // 还原按钮
    toolbar.appendChild(
      mxUtils.button("restore", function (evt) {
        graph.zoomActual();
        const zoom = { zoomFactor: 1.2 };
        that.setState({
          graph: { ...graph, ...zoom }
        });
      })
    );

    var undoManager = new mxUndoManager();
    var listener = function (sender, evt) {
      undoManager.undoableEditHappened(evt.getProperty("edit"));
    };
    graph.getModel().addListener(mxEvent.UNDO, listener);
    graph.getView().addListener(mxEvent.UNDO, listener);

    toolbar.appendChild(
      mxUtils.button("undo", function () {
        undoManager.undo();
      })
    );

    toolbar.appendChild(
      mxUtils.button("redo", function () {
        undoManager.redo();
      })
    );
    toolbar.appendChild(
      mxUtils.button("Automatic layout", function () {
        graph.getModel().beginUpdate();
        try {
          that.state.layout.execute(graph.getDefaultParent());
        } catch (e) {
          throw e;
        } finally {
          graph.getModel().endUpdate();
        }
      })
    );

    toolbar.appendChild(
      mxUtils.button("view XML", function () {
        var encoder = new mxCodec();
        var node = encoder.encode(graph.getModel());
        mxUtils.popup(mxUtils.getXml(node), true);
      })
    );
    toolbar.appendChild(
      mxUtils.button("view JSON", function () {
        const jsonNodes = that.getJsonModel(graph);
        let jsonStr = that.stringifyWithoutCircular(jsonNodes);
        localStorage.setItem("json", jsonStr);
        that.setState({
          json: jsonStr
        });
        console.log(jsonStr);
      })
    );
    toolbar.appendChild(
      mxUtils.button("render JSON", function () {
        that.renderJSON(JSON.parse(that.state.json), graph);
      })
    );
  };
  LoadGraph(data) {
    var container = ReactDOM.findDOMNode(this.refs.divGraph);
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error("Browser is not supported!", 200, false);
    } else {
      var graph = new mxGraph(container);
      this.setState(
        {
          graph: graph,
          dragElt: this.getEditPreview()
        },
        () => {
          console.log(this);
          // layout
          const layout = new mxCompactTreeLayout(graph, false);
          this.setState({ layout });
          this.setLayoutSetting(layout);
          this.loadGlobalSetting();
          this.setGraphSetting();
          this.initToolbar();
          this.settingConnection();
          this.createDragElement();
          var parent = graph.getDefaultParent();

          // Adds cells to the model in a single step
          graph.getModel().beginUpdate();
          try {
            console.log('Loading graph');
          } finally {
            // Updates the display
            graph.getModel().endUpdate();
          }
        }
      );
      // Disables the built-in context menu
      mxEvent.disableContextMenu(container);
      // Trigger event after selection
      graph
        .getSelectionModel()
        .addListener(mxEvent.CHANGE, this.selectionChange);
      var parent = graph.getDefaultParent();
    }
  }

  createShape = (cell = {}) => {
    const id = Math.ceil(Math.random() * 100);
    //` const { cell } = shape;
    if (cell && cell.id) {
      this.funct(this.state.graph, '', '', cell.geometry.x, cell.geometry.y, this.getShapeStyle(cell.shapeType), cell.shapeType, false);
      this.setState({ createVisile: false });
    } else {
      const { graph } = this.state;
      const cell = graph.getSelectionCell();
      this.setState({ createVisile: false });
      const { geometry, vertex, id, style, shapeType } = cell;
      const mxCell = { shapeType, geometry, vertex, id, style };
      this.props.socket.emit('shapeDropped', { shape: mxCell, clientId: this.props.socket.id });
    }
  }



  mouseMoveHandler = (event) => {
    let cursorPosition = {};
    cursorPosition.x = event.clientX / this.state.width;
    cursorPosition.y = event.clientY / this.state.height;
    cursorPosition.clientId = this.props.socket.id;
    this.props.socket.emit('mousemove', cursorPosition) // change 'red' to this.state.color
  }

  handleJoinRequest = () => {
    this.props.socket.on('requestToJoin', (roomName) => {
      this.setState({
        confirmLiveShare: true,
      });
    });
  }
  createRoom = () => {
    this.props.socket.emit('create', { roomName: Math.random(), users: this.state.clients });
  }

  getAvailableUsers = () => {
    if (this.state.clients) {
      const usersList = (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {this.state.clients.map((user) => {
            if (this.props.userName !== user.customId) {
              const options = this.state.clients.map(client => [{
                label: client.customId,
                value: client.customId,
              }]);
              return <Checkbox onChange={() => { }}>{user.customId}</Checkbox>
            }
          })}
        </div>
      );
      this.setState({
        usersList
      });
    }
  }

  handleDecline = () => {
    this.setState({
      confirmLiveShare: false,
    });
  }

  render() {
    return (
      <div>
        <ul className="sidebar" ref="mxSidebar">
          <li className="title" data-title="Task node" data-value="Task node">
            Task node
          </li>
          <li
            className="task"
            data-title="Kafka->HDFS"
            data-value="rectangle"
          > rectangle
          </li>
          <li
            className="task"
            data-title="Kafka->HDFS"
            data-value="triangle"
          >
            triangle
          </li>
          <li
            className="task"
            data-title="Kafka->HDFS"
            data-value="ellipse"
          >
            ellipse
          </li>
          <li
            className="task"
            data-title="Kafka->HDFS"
            data-value="line"
          >
            line
          </li>
          <li id="layout123">layout</li>
          <LiveShare usersList={this.state.usersList} getAvailableUsers={this.getAvailableUsers} handleSend={this.createRoom} />
        </ul>
        <LiveShareConfirmation show={this.state.confirmLiveShare} handleDecline={this.handleDecline} />
        <div className="toolbar" ref="toolbar" />
        <div className="container-wrapper">
          <div className="container" ref="divGraph" />
        </div>
        <div className="changeInput" style={{ zIndex: 10 }} />
        {this.state.createVisile && this.createShape()}
        <div id="clientId"></div>
      </div>
    );
  }
}

export default withSocket(mxGraphGridAreaEditor);

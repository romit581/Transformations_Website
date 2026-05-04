'use strict';

var _px = 0, _py = 0, _pw = 0;

function Mat4() { this.m = new Float32Array(16); this.identity(); }
Mat4.prototype.identity = function() {
    var m = this.m;
    m[0]=1;m[1]=0;m[2]=0;m[3]=0;
    m[4]=0;m[5]=1;m[6]=0;m[7]=0;
    m[8]=0;m[9]=0;m[10]=1;m[11]=0;
    m[12]=0;m[13]=0;m[14]=0;m[15]=1;
    return this;
};
Mat4.mul = function(a, b, o) {
    var A=a.m, B=b.m, O=o.m;
    var a00=A[0],a01=A[1],a02=A[2],a03=A[3],a10=A[4],a11=A[5],a12=A[6],a13=A[7],
        a20=A[8],a21=A[9],a22=A[10],a23=A[11],a30=A[12],a31=A[13],a32=A[14],a33=A[15];
    O[0]=a00*B[0]+a01*B[4]+a02*B[8]+a03*B[12];
    O[1]=a00*B[1]+a01*B[5]+a02*B[9]+a03*B[13];
    O[2]=a00*B[2]+a01*B[6]+a02*B[10]+a03*B[14];
    O[3]=a00*B[3]+a01*B[7]+a02*B[11]+a03*B[15];
    O[4]=a10*B[0]+a11*B[4]+a12*B[8]+a13*B[12];
    O[5]=a10*B[1]+a11*B[5]+a12*B[9]+a13*B[13];
    O[6]=a10*B[2]+a11*B[6]+a12*B[10]+a13*B[14];
    O[7]=a10*B[3]+a11*B[7]+a12*B[11]+a13*B[15];
    O[8]=a20*B[0]+a21*B[4]+a22*B[8]+a23*B[12];
    O[9]=a20*B[1]+a21*B[5]+a22*B[9]+a23*B[13];
    O[10]=a20*B[2]+a21*B[6]+a22*B[10]+a23*B[14];
    O[11]=a20*B[3]+a21*B[7]+a22*B[11]+a23*B[15];
    O[12]=a30*B[0]+a31*B[4]+a32*B[8]+a33*B[12];
    O[13]=a30*B[1]+a31*B[5]+a32*B[9]+a33*B[13];
    O[14]=a30*B[2]+a31*B[6]+a32*B[10]+a33*B[14];
    O[15]=a30*B[3]+a31*B[7]+a32*B[11]+a33*B[15];
    return o;
};
Mat4.prototype.trans = function(tx,ty,tz) { this.identity(); this.m[3]=tx; this.m[7]=ty; this.m[11]=tz; return this; };
Mat4.prototype.scale = function(sx,sy,sz) { this.identity(); this.m[0]=sx; this.m[5]=sy; this.m[10]=sz; return this; };
Mat4.prototype.rotX = function(a) { this.identity(); var c=Math.cos(a),s=Math.sin(a); this.m[5]=c;this.m[6]=-s;this.m[9]=s;this.m[10]=c; return this; };
Mat4.prototype.rotY = function(a) { this.identity(); var c=Math.cos(a),s=Math.sin(a); this.m[0]=c;this.m[2]=s;this.m[8]=-s;this.m[10]=c; return this; };
Mat4.prototype.rotZ = function(a) { this.identity(); var c=Math.cos(a),s=Math.sin(a); this.m[0]=c;this.m[1]=-s;this.m[4]=s;this.m[5]=c; return this; };
Mat4.prototype.shear = function(xy,xz,yx,zx) { this.identity(); this.m[1]=xy;this.m[2]=xz;this.m[4]=yx;this.m[8]=zx; return this; };

// Lerp helper
function lerp(a, b, t) { return a + (b - a) * t; }

function Geometry(v, e, f) {
    this.vLen = v.length; this.e = e; this.f = f;
    this.v = new Float32Array(this.vLen * 3);
    for (var i = 0; i < this.vLen; i++) { this.v[i*3]=v[i][0]; this.v[i*3+1]=v[i][1]; this.v[i*3+2]=v[i][2]; }
    this.dep = new Float32Array(f.length);
    this.fi = new Int32Array(f.length);
    for (var i = 0; i < f.length; i++) this.fi[i] = i;
}

var ShapesDict = {
    'cube': {
        v: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
        e: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
        f: [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]]
    },
    'pyramid': {
        v: [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1,0]],
        e: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]],
        f: [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,3,2,1]]
    },
    'octahedron': {
        v: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
        e: [[0,4],[4,1],[1,3],[3,0],[0,2],[2,1],[4,2],[4,3],[5,0],[5,1],[5,2],[5,3]],
        f: [[0,4,2],[2,4,1],[1,4,3],[3,4,0],[0,2,5],[2,1,5],[1,3,5],[3,0,5]]
    }
};

function createShape(t) {
    var data = ShapesDict[t];
    if (data) {
        return new Geometry(data.v, data.e, data.f);
    }
    return new Geometry([], [], []);
}

// State with lerp targets
var U = {tx:0,ty:0,tz:0,sx:1,sy:1,sz:1,rx:0,ry:0,rz:0,shxy:0,shxz:0,shyx:0,shzx:0};
var Ut = {tx:0,ty:0,tz:0,sx:1,sy:1,sz:1,rx:0,ry:0,rz:0,shxy:0,shxz:0,shyx:0,shzx:0};
var cameraDirty = true;
var camYaw = 0.45, camPitch = 0.30, camR = 7;
var canvas, ctx, W, H;
var compare = false, divX = 0, dragDiv = false, matDirty = true;
var lastFrame = 0, fCount = 0, lastFPS = 0, fpsEl;
var tMat = new Mat4(), vMat = new Mat4(), mM = new Mat4(), mR = new Mat4();
var mS = new Mat4(), mSh = new Mat4(), mRx = new Mat4(), mRy = new Mat4(), mRz = new Mat4(), mT = new Mat4();
var shape = new Geometry([[0,0,0]], [], []), targetShape = 'cube', shapeOpacity = 1, shapeDirty = true;
var nextShape = null, nextShapeOpacity = 0;

// Camera rotation matrix cache (Float32Array(9))
var camRot = new Float32Array(9);
var camRotDirty = true;

// Offscreen canvas for projection
var offCvs, offCtx;
function initOffscreen() {
    offCvs = new OffscreenCanvas(800, 600);
    offCtx = offCvs.getContext('2d', { alpha: true });
}

// Pre-allocated vertex buffers
var worldVerts, screenVerts;
function initBuffers(verts) {
    worldVerts = new Float32Array(500 * 3);
    screenVerts = new Float32Array(500 * 3);
}



// Stars
var stars = new Float32Array(600);
for (var i = 0; i < 200; i++) { stars[i*3]=Math.random(); stars[i*3+1]=Math.random(); stars[i*3+2]=Math.random(); }

var aR = 139, aG = 92, aB = 246;
var toRad = Math.PI / 180;

var _wireStr = '', _strokeBase = '';
function updateColorStr() {
    _wireStr = 'rgba(' + aR + ',' + aG + ',' + aB + ',';
    _strokeBase = 'rgba(' + aR + ',' + aG + ',' + aB + ',1)';
}
updateColorStr();

function recomputeT() {
    mS.scale(U.sx, U.sy, U.sz);
    mSh.shear(U.shxy, U.shxz, U.shyx, U.shzx);
    mRx.rotX(U.rx * toRad);
    mRy.rotY(U.ry * toRad);
    mRz.rotZ(U.rz * toRad);
    mT.trans(U.tx, U.ty, U.tz);
    Mat4.mul(mSh, mS, mM); Mat4.mul(mRx, mM, mR); Mat4.mul(mRy, mR, mM); Mat4.mul(mRz, mM, mR); Mat4.mul(mT, mR, tMat);
}

function updateCamRot() {
    var cy = Math.cos(camYaw), sy = Math.sin(camYaw);
    var cp = Math.cos(camPitch), sp = Math.sin(camPitch);
    camRot[0]=cy; camRot[1]=0; camRot[2]=-sy;
    camRot[3]=sy*sp; camRot[4]=cp; camRot[5]=cy*sp;
    camRot[6]=sy*cp; camRot[7]=-sp; camRot[8]=cy*cp;
    camRotDirty = false;
}

function proj(x, y, z, vm, fo, cx, cy) {
    var vx = x*vm[0] + y*vm[1] + z*vm[2] + vm[3];
    var vy = x*vm[4] + y*vm[5] + z*vm[6] + vm[7];
    var vz = x*vm[8] + y*vm[9] + z*vm[10] + vm[11];
    var pz = vz || 0.001;
    _px = (vx / -pz) * fo + cx;
    _py = (-vy / -pz) * fo + cy;
    _pw = -pz;
}

function xformProj(geom, tm, vm, fo, cx, cy) {
    var v = geom.v, tv = worldVerts, pv = screenVerts, T = tm.m, V = vm, len = geom.vLen;
    for (var i = 0; i < len; i++) {
        var i3 = i * 3, x = v[i3], y = v[i3+1], z = v[i3+2];
        tv[i3] = x*T[0] + y*T[1] + z*T[2] + T[3];
        tv[i3+1] = x*T[4] + y*T[5] + z*T[6] + T[7];
        tv[i3+2] = x*T[8] + y*T[9] + z*T[10] + T[11];
    }
    for (var i = 0; i < len; i++) {
        var i3 = i * 3, tx = tv[i3], ty = tv[i3+1], tz = tv[i3+2];
        var vx = tx*V[0] + ty*V[1] + tz*V[2] + V[3];
        var vy = tx*V[4] + ty*V[5] + tz*V[6] + V[7];
        var vz = tx*V[8] + ty*V[9] + tz*V[10] + V[11];
        var pz = vz || 0.001;
        pv[i3] = (vx / -pz) * fo + cx;
        pv[i3+1] = (-vy / -pz) * fo + cy;
        pv[i3+2] = vz;
    }
}

function drawGridXZ(c, vmat, fo, cx, cy) {
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.lineWidth = 1;
    c.shadowBlur = 0;
    c.beginPath();
    var V = vmat;
    var size = 5;
    for (var i = -size; i <= size; i++) {
        var x = -size, y = 0, z = i;
        var vx = x*V[0]+y*V[1]+z*V[2]+V[3], vy = x*V[4]+y*V[5]+z*V[6]+V[7], vz = x*V[8]+y*V[9]+z*V[10]+V[11];
        var pz = vz || 0.001;
        var px1 = (vx/-pz)*fo+cx, py1 = (-vy/-pz)*fo+cy;
        var ok1 = vz < -0.1;

        x = size, y = 0, z = i;
        vx = x*V[0]+y*V[1]+z*V[2]+V[3]; vy = x*V[4]+y*V[5]+z*V[6]+V[7]; vz = x*V[8]+y*V[9]+z*V[10]+V[11];
        pz = vz || 0.001;
        var px2 = (vx/-pz)*fo+cx, py2 = (-vy/-pz)*fo+cy;
        var ok2 = vz < -0.1;
        if (ok1 && ok2) { c.moveTo(px1, py1); c.lineTo(px2, py2); }

        x = i, y = 0, z = -size;
        vx = x*V[0]+y*V[1]+z*V[2]+V[3]; vy = x*V[4]+y*V[5]+z*V[6]+V[7]; vz = x*V[8]+y*V[9]+z*V[10]+V[11];
        pz = vz || 0.001;
        px1 = (vx/-pz)*fo+cx; py1 = (-vy/-pz)*fo+cy;
        ok1 = vz < -0.1;

        x = i, y = 0, z = size;
        vx = x*V[0]+y*V[1]+z*V[2]+V[3]; vy = x*V[4]+y*V[5]+z*V[6]+V[7]; vz = x*V[8]+y*V[9]+z*V[10]+V[11];
        pz = vz || 0.001;
        px2 = (vx/-pz)*fo+cx; py2 = (-vy/-pz)*fo+cy;
        ok2 = vz < -0.1;
        if (ok1 && ok2) { c.moveTo(px1, py1); c.lineTo(px2, py2); }
    }
    c.stroke();
}

function drawShapeBatched(c, geom, rgb, alpha, fo, cx, cy) {
    var pv = screenVerts, e = geom.e, f = geom.f, tv = worldVerts;
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
    c.beginPath();
    for (var i = 0, l = e.length; i < l; i++) {
        var i1 = e[i][0]*3, i2 = e[i][1]*3;
        if (pv[i1+2] < -0.1 && pv[i2+2] < -0.1) { c.moveTo(pv[i1], pv[i1+1]); c.lineTo(pv[i2], pv[i2+1]); }
    }
    c.stroke();
    c.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',1)';
    var fi = geom.fi, dep = geom.dep;
    for (var i = 0, l = f.length; i < l; i++) {
        var face = f[i], z = 0;
        for (var j = 0; j < face.length; j++) z += pv[face[j]*3+2];
        dep[i] = z / face.length;
    }
    for (var i = 1, l = fi.length; i < l; i++) {
        var k = fi[i], kd = dep[k], j = i - 1;
        while (j >= 0 && dep[fi[j]] > kd) { fi[j+1] = fi[j]; j--; }
        fi[j+1] = k;
    }
    c.lineWidth = 1.2;
    for (var k = 0, l = fi.length; k < l; k++) {
        var face = f[fi[k]], i0 = face[0]*3, i1 = face[1]*3, i2 = face[2]*3;
        var p0x = tv[i0], p0y = tv[i0+1], p0z = tv[i0+2];
        var ux = tv[i1]-p0x, uy = tv[i1+1]-p0y, uz = tv[i1+2]-p0z;
        var vx = tv[i2]-p0x, vy = tv[i2+1]-p0y, vz = tv[i2+2]-p0z;
        var nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
        var len = nx*nx + ny*ny + nz*nz;
        if (len > 0) { len = Math.sqrt(len); nx /= len; ny /= len; nz /= len; }
        var intensity = Math.max(0.15, (nx*0.577 + ny*0.577 + nz*0.577));
        var r = (rgb[0]*intensity)|0, g = (rgb[1]*intensity)|0, b = (rgb[2]*intensity)|0;
        c.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        var valid = true;
        for (var j = 0; j < face.length; j++) if (pv[face[j]*3+2] >= -0.1) { valid = false; break; }
        if (!valid) continue;
        c.beginPath(); c.moveTo(pv[i0], pv[i0+1]);
        for (var j = 1; j < face.length; j++) { var idx = face[j]*3; c.lineTo(pv[idx], pv[idx+1]); }
        c.closePath(); c.fill(); c.stroke();
    }
}

var _annEl = null, _matEl = null, _matCells = [], _annTxt = '', _matDirty = true, _matDispVals = [];

function updateDOM() {
    if (!_annEl) _annEl = document.getElementById('floating-annotation');
    if (_annEl && _matDirty) {
        var t = 'TX:' + U.tx.toFixed(1) + ' TY:' + U.ty.toFixed(1) + ' TZ:' + U.tz.toFixed(1) + '\nSX:' + U.sx.toFixed(1) + ' SY:' + U.sy.toFixed(1) + ' SZ:' + U.sz.toFixed(1);
        if (t !== _annTxt) { _annTxt = t; _annEl.innerText = t; }
    }
    if (!_matEl) _matEl = document.getElementById('matrix-display');
    if (_matEl && _matCells.length === 0) {
        var labs = ['SX','ShXY','ShXZ','TX','ShYX','SY','ShYZ','TY','ShZX','ShZY','SZ','TZ','PX','PY','PZ','W'];
        for (var i = 0; i < 16; i++) { var el = document.createElement('div'); el.className = 'matrix-cell'; el.title = labs[i]; _matEl.appendChild(el); _matCells.push(el); _matDispVals.push(0); }
    }
    if (_matEl) {
        var tm = tMat.m;
        for (var i = 0; i < 16; i++) {
            var val = tm[i], el = _matCells[i], cur = _matDispVals[i];
            cur = lerp(cur, val, 0.18);
            _matDispVals[i] = cur;
            var c = Math.abs(cur) < 0.01 ? 'mag-low' : (Math.abs(cur) > 1.5 ? 'mag-high' : 'mag-mid');
            var cn = 'matrix-cell ' + c;
            if (el.className !== cn) el.className = cn;
            var txt = Math.abs(cur) < 0.001 ? '0.00' : cur.toFixed(2);
            if (el.textContent !== txt) el.textContent = txt;
        }
        _matDirty = false;
    }
}

var _miniC = [], _miniDirty = true;

function initMini() {
    var ids = ['tx','ty','tz','sx','sy','sz','rx','ry','rz','shxy','shxz','shyx','shzx'];
    _miniC = [];
    for (var i = 0; i < ids.length; i++) {
        var c = document.getElementById('mini-' + ids[i]);
        if (c) _miniC.push({id: ids[i], c: c, ctx: c.getContext('2d')});
    }
}

function drawMinis() {
    if (!_miniDirty) return;
    var vm = new Mat4(); vm.rotX(-0.5); mM.trans(0, 0, -4); Mat4.mul(mM, vm, vm);
    for (var i = 0; i < _miniC.length; i++) {
        var mc = _miniC[i], c = mc.ctx;
        c.clearRect(0, 0, 40, 40);
        var v = U[mc.id];
        mS.scale(mc.id === 'sx' ? v : 1, mc.id === 'sy' ? v : 1, mc.id === 'sz' ? v : 1);
        mSh.shear(mc.id === 'shxy' ? v : 0, mc.id === 'shxz' ? v : 0, mc.id === 'shyx' ? v : 0, mc.id === 'shzx' ? v : 0);
        mRx.rotX(mc.id === 'rx' ? v * toRad : 0);
        mRy.rotY(mc.id === 'ry' ? v * toRad : 0);
        mRz.rotZ(mc.id === 'rz' ? v * toRad : 0);
        mT.trans(mc.id === 'tx' ? v : 0, mc.id === 'ty' ? v : 0, mc.id === 'tz' ? v : 0);
        Mat4.mul(mSh, mS, mM); Mat4.mul(mRx, mM, mR); Mat4.mul(mRy, mR, mM); Mat4.mul(mRz, mM, mR); Mat4.mul(mT, mR, mM);
        xformProj(shape, mM, vm.m, 30, 20, 20);
        drawShapeBatched(c, shape, [aR, aG, aB], 0.8, 30, 20, 20);
    }
    _miniDirty = false;
}

function loop(t) {
    requestAnimationFrame(loop);
    t = t || performance.now();
    var elapsed = t - lastFrame;
    if (elapsed < 1000 / 120) return;
    lastFrame = t;

    fCount++;
    if (t - lastFPS > 500 && fpsEl) {
        fpsEl.textContent = 'FPS: ' + Math.round(fCount / ((t - lastFPS) / 1000));
        fCount = 0; lastFPS = t;
    }


    if (!ctx) return;

    var lerping = false;
    for (var k in U) {
        if (Math.abs(U[k] - Ut[k]) > 0.001) {
            U[k] = lerp(U[k], Ut[k], 0.18);
            lerping = true;
            _miniDirty = true;
            var inp = document.getElementById(k);
            if (inp && document.activeElement !== inp) inp.value = U[k];
            var lbl = document.getElementById(k + '-val');
            if (lbl) lbl.textContent = U[k].toFixed(1) + (k[0] === 'r' ? '°' : '');
        } else if (U[k] !== Ut[k]) {
            U[k] = Ut[k];
            var inp = document.getElementById(k);
            if (inp && document.activeElement !== inp) inp.value = U[k];
            var lbl = document.getElementById(k + '-val');
            if (lbl) lbl.textContent = U[k].toFixed(1) + (k[0] === 'r' ? '°' : '');
        }
    }
    if (lerping) { matDirty = true; _matDirty = true; }

    // Shape crossfade
    if (shapeDirty) {
        if (shapeOpacity > 0.01) {
            shapeOpacity -= 0.067;
        } else {
            shape = nextShape || shape;
            shapeOpacity = nextShapeOpacity;
            nextShapeOpacity = 0;
            shapeDirty = false;
        }
    }
    if (nextShape && nextShapeOpacity < 1) {
        nextShapeOpacity += 0.067;
        if (nextShapeOpacity >= 1) { nextShape = null; }
    }

    if (camRotDirty) updateCamRot();
    if (matDirty) { recomputeT(); matDirty = false; _matDirty = true; }

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const cx = W / 2;
    const cy = H / 2;

    offCtx.clearRect(0, 0, W, H);
    offCtx.fillStyle = '#050814'; offCtx.fillRect(0, 0, W, H);

    offCtx.fillStyle = '#ffffff';
    offCtx.beginPath();
    for (var i = 0; i < 200; i++) {
        stars[i*3+2] -= 0.002; if (stars[i*3+2] <= 0) stars[i*3+2] = 1;
        var sx = (stars[i*3] - 0.5) * W / stars[i*3+2] + cx;
        var sy = (stars[i*3+1] - 0.5) * H / stars[i*3+2] + cy;
        offCtx.rect(sx | 0, sy | 0, 2, 2);
    }
    offCtx.fill();

    mRy.rotY(-camYaw); mRx.rotX(-camPitch); mT.trans(0, 0, -camR);
    Mat4.mul(mRx, mRy, mM); Mat4.mul(mT, mM, vMat);

    if (compare) {
        offCtx.save(); offCtx.beginPath(); offCtx.rect(0, 0, divX, H); offCtx.clip();
        drawGridXZ(offCtx, vMat.m, 450, cx, cy);
        mM.identity(); xformProj(shape, mM, vMat.m, 450, cx, cy);
        drawShapeBatched(offCtx, shape, [150, 150, 150], 0.8 * shapeOpacity, 450, cx, cy);
        if (nextShape) {
            xformProj(nextShape, mM, vMat.m, 450, cx, cy);
            drawShapeBatched(offCtx, nextShape, [150, 150, 150], 0.8 * nextShapeOpacity, 450, cx, cy);
        }
        offCtx.restore();
        offCtx.save(); offCtx.beginPath(); offCtx.rect(divX, 0, W - divX, H); offCtx.clip();
        drawGridXZ(offCtx, vMat.m, 450, cx, cy);
        xformProj(shape, tMat, vMat.m, 450, cx, cy);
        drawShapeBatched(offCtx, shape, [aR, aG, aB], 0.8 * shapeOpacity, 450, cx, cy);
        if (nextShape) {
            xformProj(nextShape, tMat, vMat.m, 450, cx, cy);
            drawShapeBatched(offCtx, nextShape, [aR, aG, aB], 0.8 * nextShapeOpacity, 450, cx, cy);
        }
        offCtx.restore();
    } else {
        drawGridXZ(offCtx, vMat.m, 450, cx, cy);
        mM.identity(); xformProj(shape, mM, vMat.m, 450, cx, cy);
        drawShapeBatched(offCtx, shape, [200, 200, 200], 0.2 * shapeOpacity, 450, cx, cy);
        xformProj(shape, tMat, vMat.m, 450, cx, cy);
        drawShapeBatched(offCtx, shape, [aR, aG, aB], 1.0 * shapeOpacity, 450, cx, cy);
        if (nextShape) {
            xformProj(nextShape, tMat, vMat.m, 450, cx, cy);
            drawShapeBatched(offCtx, nextShape, [aR, aG, aB], 1.0 * nextShapeOpacity, 450, cx, cy);
        }
    }

    updateDOM(); drawMinis();

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(offCvs, 0, 0, W, H);
}

function updSlider(id, val) {
    Ut[id] = val;
}

var dpr = 1;
function resize() {
    var p = canvas.parentElement;
    W = p.clientWidth || 800; H = p.clientHeight || 600;
    dpr = devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    if (offCvs) { offCvs.width = W * dpr; offCvs.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (offCtx) offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (divX === 0) divX = W;
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d', { alpha: false });
    initOffscreen();

    var bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && bgCanvas.parentNode) bgCanvas.parentNode.removeChild(bgCanvas);

    fpsEl = document.createElement('div');
    fpsEl.style.cssText = 'position:absolute;top:20px;right:20px;color:#14b8a6;font-family:var(--font-mono);font-size:14px;font-weight:bold;z-index:10;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;pointer-events:none;will-change:contents;';
    document.getElementById('canvas-container').appendChild(fpsEl);

    var els = document.querySelectorAll('input[type=range]');
    for (var i = 0; i < els.length; i++) {
        (function(el) {
            el.addEventListener('input', function(e) { updSlider(el.id, parseFloat(el.value)); });
        })(els[i]);
    }

    var btns = document.querySelectorAll('.tab-btn');
    var tabBar = document.querySelector('.tab-indicator-bar');
    for (var i = 0; i < btns.length; i++) {
        (function(btn, idx) {
            btn.addEventListener('click', function() {
                var all = document.querySelectorAll('.tab-btn,.tab-content');
                for (var j = 0; j < all.length; j++) all[j].classList.remove('active');
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
                if (tabBar) {
                    var left = btn.offsetLeft;
                    tabBar.style.transform = 'translateX(' + left + 'px)';
                    tabBar.style.width = btn.offsetWidth + 'px';
                }
                var ac = btn.style.getPropertyValue('--accent').trim();
                document.documentElement.style.setProperty('--accent', ac);
                var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(ac);
                if (m) { aR = parseInt(m[1], 16); aG = parseInt(m[2], 16); aB = parseInt(m[3], 16); updateColorStr(); }
                matDirty = true;
                _miniDirty = true;
            });
        })(btns[i], i);
    }

    var ss = document.getElementById('shape-select');
    if (ss) ss.addEventListener('change', function(e) {
        document.querySelectorAll('.shape-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        var newShape = createShape(e.target.value);
        if (!newShape.vLen || !newShape.e || newShape.e.length === 0) {
            console.error('Geometry error: vertices or edges missing for shape:', e.target.value);
            newShape = createShape('cube');
        }
        shape = newShape;
        matDirty = true;
        cameraDirty = true;
        
        shapeOpacity = 1;
        nextShape = null;
        shapeDirty = false;
    });

    var presetBtns = document.querySelectorAll('.preset-btn');
    for (var i = 0; i < presetBtns.length; i++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                btn.classList.add('pulse');
                setTimeout(function() { btn.classList.remove('pulse'); }, 200);
                for (var k in Ut) Ut[k] = (k[0] === 's' && k[1] !== 'h') ? 1 : 0;
                var p = btn.dataset.preset;
                if (p === 'stretchX') { updSlider('sx', 2.5); updSlider('sy', 1); updSlider('sz', 1); }
                if (p === 'spinY') updSlider('ry', 45);
                if (p === 'skewXY') { updSlider('shxy', 1.2); updSlider('shyx', 0.8); }
                if (p === 'mirrorZ') updSlider('sz', -1);
                if (p === 'iso') { updSlider('rx', 35); updSlider('ry', 45); }
                if (p === 'chaos') { updSlider('sx', 1.5); updSlider('ry', 30); updSlider('shxy', 0.6); updSlider('tx', 0.5); }
            });
        })(presetBtns[i]);
    }

    var br = document.getElementById('btn-reset');
    if (br) br.onclick = function() { for (var k in Ut) Ut[k] = (k[0] === 's' && k[1] !== 'h') ? 1 : 0; };

    var be = document.getElementById('btn-export');
    if (be) be.onclick = function() { var a = document.createElement('a'); a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tMat.m)); a.download = 'matrix.json'; a.click(); };

    var tog = document.getElementById('toggle-panel');
    if (tog) tog.onclick = function() { document.getElementById('app').classList.toggle('panel-collapsed'); setTimeout(resize, 310); };

    var drag = false, lx, ly;
    canvas.style.cursor = 'grab';
    canvas.onmousedown = function(e) { drag = true; lx = e.clientX; ly = e.clientY; canvas.style.cursor = 'grabbing'; canvas.parentElement.style.filter = 'brightness(1.05)'; };
    window.onmouseup = function() { drag = false; dragDiv = false; canvas.style.cursor = 'grab'; canvas.parentElement.style.filter = ''; };
    window.onmousemove = function(e) {
        if (drag) { cameraDirty = true; camRotDirty = true; camYaw -= (e.clientX - lx) * 0.01; camPitch = Math.max(-1.5, Math.min(1.5, camPitch - (e.clientY - ly) * 0.01)); lx = e.clientX; ly = e.clientY; }
        if (dragDiv) { divX = e.clientX; document.getElementById('split-divider').style.left = divX + 'px'; }
    };
    var sd = document.getElementById('split-divider');
    if (sd) sd.onmousedown = function(e) { dragDiv = true; e.stopPropagation(); };

    var learnBtns = document.querySelectorAll('.learn-more-btn');
    for (var i = 0; i < learnBtns.length; i++) {
        (function(btn) {
            btn.onclick = function() { btn.nextElementSibling.classList.toggle('expanded'); };
        })(learnBtns[i]);
    }

    shape = createShape('cube');
    initBuffers(shape.vLen);
    initMini();
    window.addEventListener('resize', resize);
    resize();
    lastFrame = performance.now();
    requestAnimationFrame(loop);
}

init();
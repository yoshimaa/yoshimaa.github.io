;(function (d, $) {

  var jQdm_horizontal_scroll;

  jQdm_horizontal_scroll = function(){

    // 初期設定
    var prop = {
      $window: $(window),
      contentContainer: '#contentContainer',
      columnContainer: '#columnContainer',
      columnContainerItem: '.column',
      columnMainContent: '.column_mainContent',
      vurtualContainer: 'body',
      transitionSpeed: 1000,
      transitionEasingDefault: 'easeOutQuint',
      transitionEasingJump: 'easeInOutQuint',
      mainNavigation: '#mainNavigation',
      dataPossessor: [],
      currentSelector: '.current',
      mode: {
        scroll: 1, // 0 ブラウザの縦スクロールバーを機能させる。 1 マウスホイールまたはスワイプのみで左右に移動。スクロールバーは機能しない。またはモバイル環境では強制このモード
        wheel: 1 // マウスホイールでの移動　0 無効 1 windows向け 2 mac向け 0以外の場合環境によって1か2は自動で判定
      },
      fitWindowWidthScale: true, // カラムの幅ををウィンドウサイズにフィットさせるか
      ua_query: {
        mobile: 'iphone ipad ipod android',
        mac: 'mac',
        windows: 'windows'
      }
    };

    function init(){

      var _$w = prop.$window,
      _$cn = $(prop.columnContainer),
      _$t = $(prop.columnContainerItem);

      // ページロード時とリサイズ時に、スナップ要素のサイズをウィンドウサイズに合わせるように設定
      _$w.on('load', function(){

        prop.mode.scroll = checkUserAgent('mobile') ? 1 : prop.mode.scroll;
        prop.mode.wheel = prop.mode.wheel == 0 ? 0 : checkUserAgent('mac') ? 2 : checkUserAgent('windows') ? 1 : prop.mode.wheel;
        if(prop.mode.scroll == 1) { // スクロールモードが１のとき、スクロールバーを隠す
          $('body').css('overflow','hidden');
        }

        if(checkUserAgent('mobile') || checkUserAgent('ipod')){
          $('*').removeClass('noSwipe');
        }
        setTargetPostion(_$t); // 各カラムの現在の位置を取得する処理を実行
        fitWindowScale(_$t); // 各カラムのサイズをスクリーンサイズに合わせる処理を実行
      });

      _$w.on('resize', function(){
        setTimeout( function() {
          setTargetPostion(_$t);
          fitWindowScale(_$t);
        }, 200);
      });

      _$w.on('resize scroll', function(e){

        preventDefault(e);
        setTargetPostion(_$t);
        if($('body').is(':animated')) {
          return;
        }
        adjustScrollPosition();
      });

      // スワイプイベント
      _$w.on('touchmove',function(e){
          preventDefault(e);
      });
      _$w.swipe({
        swipeLeft:function(ev, dir, dist, dur, fin) {
          adjustScrollPosition(dist, dist);
        },
        swipeRight:function(ev, dir, dist, dur, fin) {
          adjustScrollPosition(-dist, dist);
        }
      });

      // マウスホイールイベント
      _$w.on('mousewheel', function(e) {
          preventDefault(e);
          var _dur = e.deltaY;
          _dur = _dur > 50 ? 50 : _dur < - 50 ? -50 : _dur;
          switch(prop.mode.wheel){
            case 0:
              _dur = 0;
              break;
            case 1:
              _dur *= -150;
              break;
            case 2:
              _dur *= 2;
              break;
            default:
          }
          console.log(prop.mode.wheel);
          adjustScrollPosition(_dur, Math.abs(_dur) * 2);
      });

      // ナビゲーションのクリックイベント
      $(prop.mainNavigation).find('a').on('click', function(e){
        preventDefault(e);
        // リンクの飛び先のキャッシュ
        var _href = $(this).attr('href'),
        _diff = 0;
        // リンク先へアニメーション遷移させる
        if(_href && $(_href).length > 0) {
          _diff = getColumnContainerInfo().left + parseInt($(_href).css('left'), 10);
          // スクロール位置を各カラムの仮想コンテナ内の縦位置に移動させる。縦のスクロール移動は別途設定したスクロールイベントによって、横のスクロールに変換される
          adjustScrollPosition(_diff, prop.transitionSpeed, prop.transitionEasingJump);
        }
      });

      // カラム配置位置情報を間を置いて記憶領域にセットする
      setTimeout( function() {
        setTargetPostion(_$t);
      }, 200)

    }

    // ウィンドウのスクロール位置やスケールなどの情報を取得する
    function getWindowInfo(){

      var _$w = prop.$window;
      return {
        obj: _$w,
        w: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        h: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      };
    }

    function getColumnContainerInfo(_val){
      var _$t = $(prop.columnContainer);
      return {
        obj: _$t,
        left: parseInt(_$t.css('left')),
        top: parseInt(_$t.css('top')),
        w: _$t.width(),
        maxpos: _$t.width() - getWindowInfo().w
      }
    }

    // 仮想コンテナの情報を取得する
    function getVurtualContainerInfo(_val){
      var _$vc = $(prop.vurtualContainer),
      _win = getWindowInfo(),
      _res = _val ? _$vc.height(_val) : _$vc.height();
      return {
        obj: _$vc,
        h: _res,
        top: _$vc.scrollTop(),
        maxpos: _res - _win.h + _win.w * _$vc.height() / $(prop.columnContainer).width(),
        ratio: _$vc.height() / $(prop.columnContainer).width()
      };
    }

    // 要素をウィンドウワイズにあわせる
    function fitWindowScale(_$t){
      var _win = getWindowInfo();
      _$cn = $(prop.columnContainer),
      _pos = { x: 0, y: 0};

      _$t.each(function(){
        // 各カラムの縦幅、横幅をスクリーン（ブラウザ表示領域）サイズにあわせ、カラムコンテナ内で横に順番に並ぶようにCSSを調整
        $(this).css({
          left: _pos.x,
          width: prop.fitWindowWidthScale ? _win.w : $(this).width(),
          height: _win.h
        });

        _pos.x += $(this).width(); // 次の横並び位置をカラム幅分右にずらす
        _pos.y += $(this).height(); // 仮想コンテナの総縦幅を決めるため、各カラム縦幅を加算していく

      });

      _$cn.width(_pos.x); // カラムコンテナの横幅を設定
      getVurtualContainerInfo(_pos.y); // 仮想コンテナの縦幅をbody要素の縦幅に設定

    }

    function adjustScrollPosition(_diff, _dur, _ease){
        var _cn = getColumnContainerInfo(), // カラムコンテナの情報取得
        _win = getWindowInfo(), // ウィンドウ情報取得
        _vc = getVurtualContainerInfo(), // 仮想コンテナコンテナの情報取得
        _destX = _cn.left, // カラムコンテナの横位置の算出結果を格納
        _destY = 0;　// カラムコンテナの縦位置の算出結果を格納

        if(prop.mode.scroll == 0) { // スクロールモードが0の場合は、縦位置を横位置変換する

          if(_diff == undefined) {
            // 移動距離が設定されていないときは。縦スクロール位置が仮想コンテナ最大縦位置を超えないようにする
            _destY = _vc.top;// > _vc.h ? _vc.h : _vc.top;
          } else {
            _diff *= _vc.ratio; // 横の移動距離を、縦の仮想コンテナの移動距離に変換する
            // 移動距離が設定されているときは、移動距離分移動させたあと、縦スクロール位置が仮想コンテナ最大縦位置を超えないようにする
            _destY = _vc.top  + _diff;
          }

          _destY = _destY <= 0 ? 0 : _destY >= _vc.maxpos ? _vc.maxpos : _destY;
          _destX = -_destY / _vc.ratio; // 現在のウィンドウスクロール位置に、コンテナの横幅と仮想コンテナの縦幅の比率を乗算した値が、カラムコンテナの横位置になる

        } else {
          // スマートデバイスのときは縦位置変換をしない
          _destX -= _diff;
        }

        _destX = _destX >= 0 ? 0 : _destX <= -_cn.maxpos ? -_cn.maxpos : _destX;

        var _option = {  // アニメーションオプション
          duration: _dur ? _dur : prop.mode.scroll != 0 ? 500 : 0,
          easing: _ease || prop.transitionEasingDefault,
          queue: false,
          complete: function(){
            setTargetPostion($(prop.columnContainerItem));
          }
        };
        _vc.obj.stop(true, true).animate({
          scrollLeft: _destX,
          scrollTop: prop.mode.scroll == 0 ? _destY : 0,
        }, _option);
        _cn.obj.stop(true, true).animate({
          left: _destX,
          top: prop.mode.scroll == 0 ? _destY : 0
        }, _option);
    }

    function setTargetPostion(_$t){
      prop.dataPossessor = [];
      _$t.each(function(){
        prop.dataPossessor.push(parseInt($(this).css('left'),10));
      });
      changeCurrent();
    }

    function changeCurrent(){
      var _win = getWindowInfo(),
      _cn = getColumnContainerInfo(),
      _pos = -_cn.left - _win.w / 2, // 現在の横スクロール位置から、各カラム領域の半分位をマイナスした地点を基準に、メニューの現在地を判定する
      _dp = prop.dataPossessor,
      _$nav = $(prop.mainNavigation).find('li'),
      _cur = replaceString(prop.currentSelector);

      for(var i = 0; i < _dp.length; i++) {
        if( _pos <= _dp[i]){
          var _id = '#' + $(prop.columnContainerItem).eq(i).attr('id'),
          _$cur = $(prop.mainNavigation).find('a[href="'+_id+'"]');
          if(_$cur.length > 0){
            _$nav.removeClass(_cur);
            _$cur.parent('li').addClass(_cur);
          }
          return;
        }
      }
    }

    // 文字列置換処理
    function replaceString(_str, _bf, _af, _flg){
      var _reg = new RegExp(_bf || '[\\.#]', _flg || '');
      return _str ? _str.replace(_reg, _af || '') : false;
    }

    // デフォルトの挙動をキャンセル
    function preventDefault(e){
      if(typeof e.preventDefault !== undefined){
          e.preventDefault();
      }
    }

    // ユーザエージェントをチェックする
    function checkUserAgent(_t){
      var _ua = navigator.userAgent.toLowerCase(),
      _query = prop.ua_query,
      _res;
      for(var _k in _query){
        if(_ua.search(new RegExp(_k)) != -1) {
          _res = _k;
          break;
        }
        _res = _ua;
      }
      return _t ? _t == _res : _res;
    }

    init();

  };

  jQdm_horizontal_scroll();

})(document, jQuery);
from flask import Flask, render_template, request, jsonify, url_for, Blueprint
from flask_cors import CORS
import requests
from datetime import datetime
import os
from dotenv import load_dotenv
import logging
from googleapiclient.discovery import build
import json

# Loglama ayarlarını yapılandır
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def validate_date(date_string):
    """Tarih formatını kontrol eder"""
    try:
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False

def validate_event_data(event_data):
    """Etkinlik verilerini doğrular"""
    if not event_data or not isinstance(event_data, dict):
        return False, "Geçersiz etkinlik verisi"
    
    required_fields = ['title', 'start', 'end']
    missing_fields = [field for field in required_fields if field not in event_data]
    
    if missing_fields:
        return False, f"Gerekli alanlar eksik: {', '.join(missing_fields)}"
    
    if not validate_date(event_data['start']) or not validate_date(event_data['end']):
        return False, "Geçersiz tarih formatı"
    
    start_date = datetime.fromisoformat(event_data['start'].replace('Z', '+00:00'))
    end_date = datetime.fromisoformat(event_data['end'].replace('Z', '+00:00'))
    
    if start_date >= end_date:
        return False, "Başlangıç tarihi bitiş tarihinden önce olmalıdır"
    
    return True, None

# .env dosyasını yükle ve kontrol et
load_dotenv()

# Flask uygulamasını başlat
app = Flask(__name__)

# Uygulama yapılandırması
app.config.update(
    DEBUG=True,
    JSON_SORT_KEYS=False,
    TEMPLATES_AUTO_RELOAD=True,
    SEND_FILE_MAX_AGE_DEFAULT=0
)

# CORS ayarlarını yapılandır
CORS(app)

# Blueprint oluştur
api = Blueprint('api', __name__)

@app.route('/')
def index():
    """Ana sayfa"""
    logger.info('Ana sayfa isteği alındı')
    return render_template('index.html')

@api.route('/events', methods=['GET', 'POST'])
def events():
    """Etkinlik işlemleri için endpoint"""
    logger.info(f'Events endpoint\'ine {request.method} isteği alındı')
    logger.debug(f'Request Headers: {dict(request.headers)}')
    logger.debug(f'Request URL: {request.url}')
    
    try:
        if request.method == 'GET':
            # Yerel depodan etkinlikleri getir
            return jsonify({'success': True, 'events': []}), 200
        
        elif request.method == 'POST':
            logger.debug('POST isteği işleniyor')
            
            if not request.is_json:
                logger.warning('Content-Type application/json olmalı')
                return jsonify({'error': 'Content-Type application/json olmalı'}), 400
            
            data = request.get_json()
            logger.debug(f'Gelen veri: {data}')
            
            if not data or 'event' not in data:
                logger.warning('Geçersiz veri formatı')
                return jsonify({'error': 'Geçersiz veri formatı. Beklenen: {"event": {...}}'}), 400
            
            # Etkinlik verilerini doğrula
            is_valid, error_message = validate_event_data(data['event'])
            if not is_valid:
                logger.warning(f'Veri doğrulama hatası: {error_message}')
                return jsonify({'error': error_message}), 400
            
            # Başarılı yanıt döndür
            return jsonify({'success': True, 'data': data['event']}), 201
            
    except Exception as e:
        logger.error(f'Events endpoint hatası: {str(e)}', exc_info=True)
        return jsonify({'error': f'Beklenmeyen bir hata oluştu: {str(e)}'}), 500

@api.route('/events/<event_id>', methods=['PUT', 'DELETE'])
def event_operations(event_id):
    """Tekil etkinlik işlemleri için endpoint"""
    logger.info(f'Event operations endpoint\'ine {request.method} isteği alındı: {event_id}')
    
    try:
        if not event_id:
            logger.warning('Event ID gerekli')
            return jsonify({'error': 'Event ID gerekli'}), 400
        
        if request.method == 'PUT':
            if not request.is_json:
                logger.warning('Content-Type application/json olmalı')
                return jsonify({'error': 'Content-Type application/json olmalı'}), 400
            
            data = request.get_json()
            logger.debug(f'Gelen veri: {data}')
            
            if not data or 'event' not in data:
                logger.warning('Geçersiz veri formatı')
                return jsonify({'error': 'Geçersiz veri formatı. Beklenen: {"event": {...}}'}), 400
            
            # Etkinlik verilerini doğrula
            is_valid, error_message = validate_event_data(data['event'])
            if not is_valid:
                logger.warning(f'Veri doğrulama hatası: {error_message}')
                return jsonify({'error': error_message}), 400
            
            # Başarılı yanıt döndür
            return jsonify({'success': True, 'data': data['event']}), 200
        
        elif request.method == 'DELETE':
            # Başarılı yanıt döndür
            return jsonify({'success': True, 'message': 'Etkinlik silindi'}), 200
            
    except Exception as e:
        logger.error(f'Event operations endpoint hatası: {str(e)}', exc_info=True)
        return jsonify({'error': f'Beklenmeyen bir hata oluştu: {str(e)}'}), 500

@api.route('/save-events', methods=['POST'])
def save_events_to_json():
    """Etkinlikleri JSON dosyasına kaydet"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type application/json olmalı'}), 400

        data = request.get_json()
        if not data or 'events' not in data:
            return jsonify({'error': 'Geçersiz veri formatı'}), 400

        # JSON klasörünü oluştur (yoksa)
        json_dir = os.path.join(os.path.dirname(__file__), 'json')
        if not os.path.exists(json_dir):
            os.makedirs(json_dir)

        # Etkinlikleri JSON dosyasına kaydet
        json_file = os.path.join(json_dir, 'events.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data['events'], f, ensure_ascii=False, indent=2)

        return jsonify({'success': True, 'message': 'Etkinlikler JSON dosyasına kaydedildi'}), 200

    except Exception as e:
        logger.error(f'JSON kaydetme hatası: {str(e)}', exc_info=True)
        return jsonify({'error': f'JSON kaydetme hatası: {str(e)}'}), 500

# Debug endpoint'leri
@api.route('/debug/routes', methods=['GET'])
def list_routes():
    """Tüm route'ları listele"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify(routes)

@api.route('/debug/env', methods=['GET'])
def check_env():
    """Çevresel değişkenleri kontrol et"""
    return jsonify({
        'debug_mode': app.debug,
        'env_file_exists': os.path.exists('.env')
    })

@app.route('/test')
def test():
    """Test endpoint'i"""
    return jsonify({
        'status': 'running',
        'registered_blueprints': [bp.name for bp in app.blueprints.values()],
        'routes': [str(rule) for rule in app.url_map.iter_rules()]
    })

@app.route('/settings')
def settings():
    """Ayarlar sayfası"""
    logger.info('Ayarlar sayfası isteği alındı')
    return render_template('settings.html')

@api.route('/settings/notion', methods=['POST'])
def update_notion_settings():
    """Notion ayarlarını güncelle"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type application/json olmalı'}), 400

        data = request.get_json()
        if not data or 'notion_token' not in data or 'notion_database_id' not in data:
            return jsonify({'error': 'Geçersiz veri formatı'}), 400

        # .env dosyasını güncelle
        with open('.env', 'w') as f:
            f.write(f'NOTION_TOKEN={data["notion_token"]}\n')
            f.write(f'NOTION_DATABASE_ID={data["notion_database_id"]}\n')

        # Çevresel değişkenleri güncelle
        os.environ['NOTION_TOKEN'] = data['notion_token']
        os.environ['NOTION_DATABASE_ID'] = data['notion_database_id']

        return jsonify({'success': True, 'message': 'Notion ayarları güncellendi'}), 200

    except Exception as e:
        logger.error(f'Notion ayarları güncelleme hatası: {str(e)}', exc_info=True)
        return jsonify({'error': f'Notion ayarları güncellenirken bir hata oluştu: {str(e)}'}), 500

# Hata yakalayıcılar
@app.errorhandler(404)
def not_found_error(error):
    """404 hatası için yakalayıcı"""
    logger.warning(f'404 Hatası: {request.url}')
    return jsonify({'error': 'İstenen kaynak bulunamadı'}), 404

@app.errorhandler(500)
def internal_error(error):
    """500 hatası için yakalayıcı"""
    logger.error(f'500 Hatası: {str(error)}', exc_info=True)
    return jsonify({'error': 'Sunucu hatası'}), 500

@app.errorhandler(Exception)
def handle_exception(error):
    """Genel hata yakalayıcı"""
    logger.error(f'Beklenmeyen hata: {str(error)}', exc_info=True)
    return jsonify({'error': 'Beklenmeyen bir hata oluştu'}), 500

# API Blueprint'i kaydet
app.register_blueprint(api, url_prefix='/api')

@app.route('/time')
def time():
    """Saat sayfası"""
    logger.info('Saat sayfası isteği alındı')
    return render_template('time.html')

@app.route('/music')
def music():
    """Müzik sayfası"""
    logger.info('Müzik sayfası isteği alındı')
    return render_template('music.html')

@app.route('/save_pomodoro_stats', methods=['POST'])
def save_pomodoro_stats():
    try:
        stats = request.get_json()
        with open('json/pomodoro.json', 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=4)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# YouTube API için gerekli route'lar
@app.route('/api/youtube/video-info', methods=['POST'])
def get_youtube_video_info():
    try:
        print("\n=== YouTube API İsteği Başladı ===")
        data = request.get_json()
        video_id = data.get('videoId')
        
        print(f"Gelen Video ID: {video_id}")
        
        if not video_id:
            print("Hata: Video ID bulunamadı")
            return jsonify({'error': 'Video ID gerekli'}), 400

        api_key = os.getenv('YOUTUBE_API_KEY')
        print(f"API Anahtarı mevcut: {'Evet' if api_key else 'Hayır'}")
        
        if not api_key:
            print("Hata: YouTube API anahtarı bulunamadı")
            return jsonify({'error': 'YouTube API anahtarı bulunamadı'}), 500

        try:
            youtube = build('youtube', 'v3', developerKey=api_key)
            print("YouTube API servisi oluşturuldu")
            
            print(f"Video bilgileri isteniyor: {video_id}")
            video_response = youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=video_id
            ).execute()
            print(f"API'den yanıt alındı: {video_response}")

            if not video_response.get('items'):
                print(f"Hata: Video bulunamadı (ID: {video_id})")
                return jsonify({'error': 'Video bulunamadı'}), 404

            video = video_response['items'][0]
            snippet = video['snippet']
            content_details = video['contentDetails']
            statistics = video['statistics']

            response_data = {
                'title': snippet['title'],
                'channelTitle': snippet['channelTitle'],
                'thumbnail': snippet['thumbnails']['high']['url'],
                'duration': content_details['duration'],
                'viewCount': statistics.get('viewCount', '0'),
                'likeCount': statistics.get('likeCount', '0')
            }
            
            print(f"İşlenmiş yanıt: {response_data}")
            print("=== YouTube API İsteği Başarılı ===\n")
            return jsonify(response_data)

        except Exception as api_error:
            print(f"YouTube API Hatası: {str(api_error)}")
            return jsonify({'error': f'YouTube API Hatası: {str(api_error)}'}), 500

    except Exception as e:
        print(f"Genel Hata: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/tasks')
def tasks():
    return render_template('tasks.html')

if __name__ == '__main__':
    # Mevcut route'ları logla
    print("Kayıtlı route'lar:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.rule}")
    app.run(debug=True, port=5000, host='127.0.0.1') 
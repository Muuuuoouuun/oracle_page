-- Oracle Page — 초기 예언 데이터
--
-- 유저 없이도 둘러볼 거리가 있도록 예언만 심는다.
-- (프로필은 회원가입 시 트리거가 만든다)
--
-- 로컬: supabase db reset 이 자동으로 실행
-- 원격: supabase db push 후 이 파일을 SQL Editor 에 붙여넣기

do $$
declare
  v_id uuid;
begin
  -- 이미 심었으면 건너뛴다
  if exists (select 1 from public.oracles limit 1) then
    raise notice '예언 데이터가 이미 있어 시드를 건너뜁니다.';
    return;
  end if;

  -- ── 초단기 : 앉은 자리에서 결과를 볼 수 있게 ──
  insert into public.oracles (title, description, category, ends_at, tags, is_hot, is_new, creator_name, creator_avatar)
  values ('다음 10분 안에 이 예언에 5명 이상 참여할까?',
          '가장 빠른 예언. 10분 뒤 바로 결과가 나옵니다. 감을 시험해보세요.',
          '사회/문화', now() + interval '10 minutes', array['초단기','10분'], true, true, '번개예언가', '⚡')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '5명 이상 🔥', 0), (v_id, '5명 미만 🤔', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_trending, is_new, creator_name, creator_avatar)
  values ('30분 뒤, 비트코인 예언 참여자가 5,400명을 넘을까?',
          '30분짜리 초단기 예언. 커뮤니티의 속도를 맞춰보세요.',
          '경제/주식', now() + interval '30 minutes', array['초단기','비트코인'], true, true, '크립토마스터', '🪙')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '넘는다 📈', 0), (v_id, '못 넘는다 📉', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_hot, is_new, creator_name, creator_avatar)
  values ('1시간 뒤 오늘의 인기 예언 1위는 스포츠 카테고리일까?',
          '1시간 뒤 집계 결과로 판정합니다.',
          '스포츠', now() + interval '1 hour', array['초단기','1시간'], true, true, '축구예언자', '⚽')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '스포츠 ⚽', 0), (v_id, '다른 카테고리 🎲', 1);
  perform public.recalc_options(v_id);

  -- ── 일반 ──
  insert into public.oracles (title, description, category, ends_at, tags, is_hot, is_trending, creator_name, creator_avatar)
  values ('삼성전자, 2026 Q2 실적이 전분기 대비 상승할까?',
          '글로벌 반도체 수요 회복과 HBM 수출 증가로 삼성전자의 2분기 실적 상승이 예상됩니다. 당신의 예언은?',
          '경제/주식', now() + interval '5 days', array['삼성전자','반도체','주식'], true, true, '오라클킹', '👑')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '상승 📈', 0), (v_id, '하락 📉', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_hot, is_new, creator_name, creator_avatar)
  values ('손흥민, 2026 월드컵 한국 대표팀 출전할까?',
          '무릎 부상 이후 컨디션 회복 중인 손흥민. 2026 월드컵 본선 무대를 밟을 수 있을까요?',
          '스포츠', now() + interval '3 days', array['손흥민','월드컵','축구'], true, true, '축구예언자', '⚽')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '출전 ⚽', 0), (v_id, '불출전 🚫', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_trending, creator_name, creator_avatar)
  values ('비트코인 2026년 내 10만 달러 돌파 유지할까?',
          '2025년 말 10만 달러를 돌파한 비트코인. 2026년 내내 그 수준을 유지할 수 있을지 예언해보세요.',
          '경제/주식', now() + interval '90 days', array['비트코인','암호화폐','투자'], true, '크립토마스터', '🪙')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '유지 🚀', 0), (v_id, '하락 💸', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_new, creator_name, creator_avatar)
  values ('내일 서울 기온이 20도 이상일까?',
          '봄이 왔다! 내일 서울의 최고기온이 20도를 넘을까요? 가장 쉬운 예언에 도전해보세요!',
          '날씨/자연', now() + interval '20 hours', array['날씨','서울','봄'], true, '기상예언자', '🌤️')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '20도 이상 ☀️', 0), (v_id, '20도 미만 🌥️', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, ends_at, tags, is_trending, creator_name, creator_avatar)
  values ('GPT-5 출시일이 2026년 6월 이전일까?',
          '오픈AI의 차기 모델 GPT-5. 2026년 6월 이전에 공식 출시될 것이라는 루머가 무성한데, 당신의 예언은?',
          '기술/AI', now() + interval '60 days', array['GPT-5','AI','OpenAI'], true, 'AI예언가', '🤖')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '6월 이전 출시 🤖', 0), (v_id, '6월 이후 출시 ⏳', 1);
  perform public.recalc_options(v_id);

  insert into public.oracles (title, description, category, status, ends_at, tags, is_new, creator_name, creator_avatar)
  values ('아이브 컴백 앨범 멜론 차트 1위 달성할까?',
          '하반기 컴백이 예고된 아이브. 신보 발매 후 멜론 실시간 차트 1위를 차지할 수 있을지 예언해주세요!',
          '엔터테인먼트', 'upcoming', now() + interval '45 days', array['아이브','케이팝','음원'], true, '팝예언녀', '🎵')
  returning id into v_id;
  insert into public.bet_options (oracle_id, label, position) values
    (v_id, '1위 달성 🏆', 0), (v_id, '1위 실패 😢', 1);
  perform public.recalc_options(v_id);

  raise notice '예언 % 개를 심었습니다.', (select count(*) from public.oracles);
end;
$$;

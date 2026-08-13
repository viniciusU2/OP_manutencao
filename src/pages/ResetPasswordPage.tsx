import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { PasswordRecoveryLayout } from "../components/PasswordRecoveryLayout";

export function ResetPasswordPage(){
  const [params]=useSearchParams(); const token=params.get("token")||"";
  const [senha,setSenha]=useState(""); const [confirmar,setConfirmar]=useState(""); const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false); const [success,setSuccess]=useState(false); const [error,setError]=useState(token?"":"Link de recuperação inválido ou incompleto.");
  async function submit(e:React.FormEvent){e.preventDefault();setError("");
    if(senha.length<8){setError("A senha deve ter pelo menos 8 caracteres.");return}
    if(senha!==confirmar){setError("A confirmação da senha não corresponde.");return}
    setLoading(true);try{await api.post("/reset-password",{token,nova_senha:senha,confirmar_senha:confirmar});setSuccess(true);}
    catch(err:any){setError(err?.response?.data?.detail||"Não foi possível redefinir a senha.");}finally{setLoading(false)}
  }
  const field=(label:string,value:string,set:(v:string)=>void,autoComplete:string)=><label className="grid gap-2 text-sm font-semibold text-slate-700">{label}<span className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100"><Lock size={18} className="text-slate-400"/><input type={show?"text":"password"} required minLength={8} maxLength={128} autoComplete={autoComplete} value={value} onChange={e=>set(e.target.value)} className="min-h-11 w-full border-0 bg-transparent outline-none"/><button type="button" aria-label={show?"Ocultar senha":"Mostrar senha"} onClick={()=>setShow(v=>!v)} className="border-0 bg-transparent p-1 text-slate-500">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>;
  return <PasswordRecoveryLayout><h1 className="m-0 text-2xl font-bold">Redefinir senha</h1><p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Crie uma nova senha com pelo menos 8 caracteres.</p>
    {success?<div><div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Senha alterada com sucesso. Você já pode entrar no ENGVI.</div><Link to="/login" className="mt-5 flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 font-bold text-white">Voltar ao login</Link></div>:
    <form onSubmit={submit} className="grid gap-4">{field("Nova senha",senha,setSenha,"new-password")}{field("Confirmar nova senha",confirmar,setConfirmar,"new-password")}{error&&<p role="alert" className="m-0 text-sm text-red-600">{error}</p>}<button disabled={loading||!token} className="min-h-11 rounded-lg bg-blue-700 px-4 font-bold text-white hover:bg-blue-800 disabled:opacity-50">{loading?"Redefinindo...":"Redefinir senha"}</button></form>}
    {!success&&<Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft size={16}/>Voltar ao login</Link>}
  </PasswordRecoveryLayout>;
}
